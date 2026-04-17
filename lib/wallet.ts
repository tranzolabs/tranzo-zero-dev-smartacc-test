import { baseSepolia } from "viem/chains";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import type { LocalAccount, WalletClient, Account } from "viem";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";

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
