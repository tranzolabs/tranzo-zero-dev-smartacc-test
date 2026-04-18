import { baseSepolia } from "viem/chains";
import { createPublicClient, http, createWalletClient, custom, parseEther, zeroAddress } from "viem";
import type { LocalAccount, WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { toPermissionValidator } from "@zerodev/permissions";
import { toCallPolicy, CallPolicyVersion } from "@zerodev/permissions/policies";
import { toECDSASigner } from "@zerodev/permissions/signers";

// ─── Constants ────────────────────────────────────────────────────────────────
export const CHAIN = baseSepolia;
export const ENTRY_POINT = getEntryPoint("0.7");
export const KERNEL_VERSION = KERNEL_V3_1;

const ZERODEV_RPC =
  process.env.NEXT_PUBLIC_ZERODEV_RPC ??
  "https://rpc.zerodev.app/api/v3/de85bc35-12e0-4ad5-a122-1fe8397ead14/chain/84532";

// ─── Public Client ─────────────────────────────────────────────────────────────
export function getPublicClient() {
  return createPublicClient({
    chain: CHAIN,
    transport: http("https://sepolia.base.org"),
  });
}

// ─── MetaMask WalletClient ────────────────────────────────────────────────────
export function getMetaMaskWalletClient(address: `0x${string}`): WalletClient {
  const eth = (window as any).ethereum;
  return createWalletClient({
    account: address,
    chain: CHAIN,
    transport: custom(eth),
  });
}

// ─── Core: any signer → Kernel Smart Account ─────────────────────────────────
// Accepts LocalAccount (embedded) or WalletClient (MetaMask)
export async function createSmartAccount(signer: LocalAccount | WalletClient) {
  const publicClient = getPublicClient();

  // signerToEcdsaValidator accepts both LocalAccount and WalletClient
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: signer as any,
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  return account;
}

// ─── Get smart account address ────────────────────────────────────────────────
export async function getSmartAccountAddress(
  signer: LocalAccount | WalletClient
): Promise<string> {
  const account = await createSmartAccount(signer);
  return account.address;
}

// ─── Gasless Client — ZeroDev Paymaster ──────────────────────────────────────
export async function createGaslessClient(signer: LocalAccount | WalletClient) {
  const publicClient = getPublicClient();
  const account = await createSmartAccount(signer);

  const paymasterClient = createZeroDevPaymasterClient({
    chain: CHAIN,
    transport: http(ZERODEV_RPC),
  });

  const kernelClient = createKernelAccountClient({
    account,
    chain: CHAIN,
    bundlerTransport: http(ZERODEV_RPC),
    client: publicClient,
    paymaster: {
      getPaymasterData: async (userOperation) => {
        try {
          return await paymasterClient.sponsorUserOperation({ userOperation });
        } catch (e) {
          console.error("Paymaster error:", e);
          return {} as Awaited<ReturnType<typeof paymasterClient.sponsorUserOperation>>;
        }
      },
    },
  });

  return { kernelClient, account, publicClient };
}

// ─── Send gasless ETH transfer ────────────────────────────────────────────────
export async function sendGaslessTransfer(
  signer: LocalAccount | WalletClient,
  to: `0x${string}`,
  amount: bigint,
  data: `0x${string}` = "0x"
) {
  const { kernelClient } = await createGaslessClient(signer);

  const userOpHash = await kernelClient.sendUserOperation({
    callData: await kernelClient.account.encodeCalls([
      { to, value: amount, data },
    ]),
  });

  const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });
  return { userOpHash, receipt };
}

// ─── Card Session Key Storage Keys ───────────────────────────────────────────
export const CARD_SK_STORAGE   = "tranzo_card_sk";
export const CARD_LIM_STORAGE  = "tranzo_card_limit_eth";
export const CARD_ACTIVE_KEY   = "tranzo_card_active";

// ─── Activate Card (instant, FREE — no on-chain tx needed) ───────────────────
export async function activateCard(
  masterSigner: LocalAccount | WalletClient,
  spendLimitEth: string
) {
  const publicClient = getPublicClient();

  // 1. Master validator — needed to derive the correct smart account address
  const sudoValidator = await signerToEcdsaValidator(publicClient, {
    signer: masterSigner as any,
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  // 2. Generate fresh session key — this IS the "card key" stored in browser
  const sessionKeyPK = generatePrivateKey();
  const sessionKeySigner = privateKeyToAccount(sessionKeyPK);

  // 3. Call policy: max N ETH per swipe, any merchant allowed
  const callPolicy = toCallPolicy({
    policyVersion: CallPolicyVersion.V0_0_3,
    permissions: [
      { target: zeroAddress, valueLimit: parseEther(spendLimitEth) },
    ],
  });

  // 4. Permission validator scoped to session key + call policy
  const sessionValidator = await toPermissionValidator(publicClient, {
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
    signer: await toECDSASigner({ signer: sessionKeySigner }),
    policies: [callPolicy],
  });

  // 5. Kernel account with BOTH validators
  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: sudoValidator, regular: sessionValidator },
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  // 6. Paymaster (all gas sponsored by ZeroDev — user pays nothing)
  const paymasterClient = createZeroDevPaymasterClient({
    chain: CHAIN,
    transport: http(ZERODEV_RPC),
  });

  // 7. Master-signed client to install the session key plugin on-chain
  const masterKernelClient = createKernelAccountClient({
    account,
    chain: CHAIN,
    bundlerTransport: http(ZERODEV_RPC),
    client: publicClient,
    paymaster: {
      getPaymasterData: async (userOperation) =>
        paymasterClient.sponsorUserOperation({ userOperation }),
    },
  });

  // 8. Send 0-value tx — this installs the session key as a `regular` validator
  //    on-chain so future card payments auto-sign WITHOUT master key.
  //    Gas = FREE (ZeroDev sponsors it).
  const setupHash = await masterKernelClient.sendUserOperation({
    calls: [
      { to: zeroAddress, value: BigInt(0), data: "0x" },
    ],
  });
  await masterKernelClient.waitForUserOperationReceipt({ hash: setupHash });

  // 9. Save locally — card is now active and ready to spend
  localStorage.setItem(CARD_SK_STORAGE, sessionKeyPK);
  localStorage.setItem(CARD_LIM_STORAGE, spendLimitEth);
  localStorage.setItem(CARD_ACTIVE_KEY, "true");

  return { sessionKeyPK, accountAddress: account.address, setupHash };
}

// ─── Card Payment (session key auto-signs — NO master key popup) ──────────────
export async function sendCardPayment(
  smartAccountAddress: `0x${string}`,
  sessionKeyPK: string,
  merchantAddress: `0x${string}`,
  amount: bigint,
  spendLimitEth: string
) {
  const publicClient = getPublicClient();

  // Recreate session key signer from stored PK
  const sessionKeySigner = privateKeyToAccount(sessionKeyPK as `0x${string}`);

  const callPolicy = toCallPolicy({
    policyVersion: CallPolicyVersion.V0_0_3,
    permissions: [
      { target: zeroAddress, valueLimit: parseEther(spendLimitEth) },
    ],
  });

  const sessionValidator = await toPermissionValidator(publicClient, {
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
    signer: await toECDSASigner({ signer: sessionKeySigner }),
    policies: [callPolicy],
  });

  // Dummy sudo validator so ZeroDev SDK's encodeCalls works gracefully
  // This dummy signer is NEVER used for signing, only to fulfill the plugin manager shape.
  const { generatePrivateKey } = await import("viem/accounts");
  const dummySigner = privateKeyToAccount(generatePrivateKey());
  const sudoValidator = await signerToEcdsaValidator(publicClient, {
    signer: dummySigner,
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  // Account uses BOTH plugins, initialized with existing smartAccountAddress.
  // Because it was created via a KernelAccountClient without master override, 
  // it defaults to the 'regular' plugin for actual userOp signing.
  const account = await createKernelAccount(publicClient, {
    address: smartAccountAddress,
    plugins: { sudo: sudoValidator, regular: sessionValidator },
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  const paymasterClient = createZeroDevPaymasterClient({
    chain: CHAIN,
    transport: http(ZERODEV_RPC),
  });

  // PRE-FLIGHT BALANCE CHECK
  const balance = await publicClient.getBalance({ address: smartAccountAddress });
  if (balance < amount) {
    throw new Error(`Insufficient Balance. You have ${(Number(balance)/1e18).toFixed(4)} ETH but tried to spend ${(Number(amount)/1e18).toFixed(4)} ETH.`);
  }

  // Session key client — no master key approval for each tx!
  const cardClient = createKernelAccountClient({
    account,
    chain: CHAIN,
    bundlerTransport: http(ZERODEV_RPC),
    client: publicClient,
    paymaster: {
      getPaymasterData: async (userOperation) =>
        paymasterClient.sponsorUserOperation({ userOperation }),
    },
  });

  const userOpHash = await cardClient.sendUserOperation({
    calls: [
      { to: merchantAddress, value: amount, data: "0x" },
    ],
  });

  const receipt = await cardClient.waitForUserOperationReceipt({ hash: userOpHash });
  return { userOpHash, receipt };
}
