"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { LocalAccount, WalletClient } from "viem";
import { generateCardDetails } from "./cardUtils";
import {
  getSmartAccountAddress,
  getMetaMaskWalletClient,
  activateCard as activateCardLib,
  sendCardPayment as sendCardPaymentLib,
  CARD_SK_STORAGE,
  CARD_LIM_STORAGE,
  CARD_ACTIVE_KEY,
} from "@/lib/wallet";

// ─── Types ────────────────────────────────────────────────────────────────────
type SignerType = "embedded" | "metamask";

interface WalletContextType {
  signer: LocalAccount | WalletClient | null;
  eoaAddress: string;
  smartAddress: string;
  signerType: SignerType | null;
  isLoading: boolean;
  isConnected: boolean;
  // Card state
  isCardActive: boolean;
  cardSpendLimit: string;
  cardIsActivating: boolean;
  // Actions
  connectMetaMask: () => Promise<void>;
  createEmbeddedWallet: () => Promise<void>;
  importPrivateKey: (pk: string) => Promise<void>;
  activateCard: (limitEth: string) => Promise<void>;
  sendCardPayment: (merchant: `0x${string}`, amount: bigint) => Promise<{ userOpHash: string }>;
  deactivateCard: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);
const STORAGE_KEY = "tranzo_eoa_pk";
const SIGNER_TYPE_KEY = "tranzo_signer_type";

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [signer, setSigner] = useState<LocalAccount | WalletClient | null>(null);
  const [eoaAddress, setEoaAddress] = useState("");
  const [smartAddress, setSmartAddress] = useState("");
  const [signerType, setSignerType] = useState<SignerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Card state
  const [isCardActive, setIsCardActive] = useState(false);
  const [cardSpendLimit, setCardSpendLimit] = useState("0.05");
  const [cardIsActivating, setCardIsActivating] = useState(false);

  // Restore wallet on mount
  useEffect(() => {
    restoreWallet().finally(() => setIsLoading(false));
    // Restore card state
    if (typeof window !== "undefined") {
      const active = localStorage.getItem(CARD_ACTIVE_KEY) === "true";
      const limit = localStorage.getItem(CARD_LIM_STORAGE) ?? "0.05";
      setIsCardActive(active);
      setCardSpendLimit(limit);
    }
  }, []);

  async function restoreWallet() {
    const type = localStorage.getItem(SIGNER_TYPE_KEY) as SignerType | null;
    if (type === "embedded") {
      const pk = localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;
      if (pk) await initEmbedded(pk);
    } else if (type === "metamask") {
      const eth = (window as any).ethereum;
      if (eth) {
        try {
          const accounts: string[] = await eth.request({ method: "eth_accounts" });
          if (accounts[0]) await initMetaMask(accounts[0] as `0x${string}`);
        } catch {}
      }
    }
  }

  // ─── Init from embedded private key ───────────────────────────────────────
  async function initEmbedded(pk: `0x${string}`) {
    setIsLoading(true);
    try {
      const account = privateKeyToAccount(pk);
      const sa = await getSmartAccountAddress(account);
      setSigner(account);
      setEoaAddress(account.address);
      setSmartAddress(sa);
      setSignerType("embedded");
    } catch (err) {
      console.error("Embedded wallet init error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Init from MetaMask address ───────────────────────────────────────────
  async function initMetaMask(address: `0x${string}`) {
    setIsLoading(true);
    try {
      const walletClient = getMetaMaskWalletClient(address);
      const sa = await getSmartAccountAddress(walletClient);
      setSigner(walletClient);
      setEoaAddress(address);
      setSmartAddress(sa);
      setSignerType("metamask");
    } catch (err) {
      console.error("MetaMask init error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Connect MetaMask ──────────────────────────────────────────────────────
  async function connectMetaMask() {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("MetaMask not found! Please install the MetaMask extension.");
      return;
    }
    setIsLoading(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const address = accounts[0] as `0x${string}`;
      localStorage.setItem(SIGNER_TYPE_KEY, "metamask");
      await initMetaMask(address);
    } catch (err) {
      console.error("MetaMask connect error:", err);
      setIsLoading(false);
    }
  }

  // ─── Import Private Key ────────────────────────────────────────────────────
  async function importPrivateKey(rawKey: string) {
    let pk = rawKey.trim() as `0x${string}`;
    if (!pk.startsWith("0x")) pk = `0x${pk}`;
    if (pk.length !== 66) throw new Error("Invalid private key — must be 64 hex characters");
    localStorage.setItem(STORAGE_KEY, pk);
    localStorage.setItem(SIGNER_TYPE_KEY, "embedded");
    await initEmbedded(pk);
  }

  // ─── Create Embedded Wallet ────────────────────────────────────────────────
  async function createEmbeddedWallet() {
    const pk = generatePrivateKey();
    localStorage.setItem(STORAGE_KEY, pk);
    localStorage.setItem(SIGNER_TYPE_KEY, "embedded");
    await initEmbedded(pk);
  }

  // ─── Activate Card (installs session key on-chain via master key) ──────────
  async function activateCard(limitEth: string) {
    if (!signer) throw new Error("No signer — connect wallet first");
    setCardIsActivating(true);
    try {
      const { sessionKeyPK } = await activateCardLib(signer, limitEth);
      setIsCardActive(true);
      setCardSpendLimit(limitEth);

      // Register the deterministic card in the "Backend Network"
      if (smartAddress) {
        const { number, cvv } = generateCardDetails(smartAddress);
        await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber: number,
            cvv,
            smartAddress,
            sessionKeyPK,
            spendLimit: limitEth
          })
        }).catch(console.error);
      }
    } finally {
      setCardIsActivating(false);
    }
  }

  // ─── Card Payment (session key auto-signs, no master key needed) ───────────
  async function sendCardPayment(merchant: `0x${string}`, amount: bigint) {
    if (!signer) throw new Error("No signer");
    const sessionKeyPK = localStorage.getItem(CARD_SK_STORAGE);
    const limitEth = localStorage.getItem(CARD_LIM_STORAGE) ?? cardSpendLimit;
    if (!sessionKeyPK) throw new Error("Card not activated — activate card first");
    const result = await sendCardPaymentLib(smartAddress as `0x${string}`, sessionKeyPK, merchant, amount, limitEth);
    return { userOpHash: result.userOpHash };
  }

  // ─── Deactivate Card ───────────────────────────────────────────────────────
  function deactivateCard() {
    localStorage.removeItem(CARD_SK_STORAGE);
    localStorage.removeItem(CARD_LIM_STORAGE);
    localStorage.removeItem(CARD_ACTIVE_KEY);
    setIsCardActive(false);
    setCardSpendLimit("0.05");
  }

  // ─── Disconnect ────────────────────────────────────────────────────────────
  function disconnect() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIGNER_TYPE_KEY);
    deactivateCard();
    setSigner(null);
    setEoaAddress("");
    setSmartAddress("");
    setSignerType(null);
  }

  return (
    <WalletContext.Provider
      value={{
        signer,
        eoaAddress,
        smartAddress,
        signerType,
        isLoading,
        isConnected: !!signer && !!smartAddress,
        isCardActive,
        cardSpendLimit,
        cardIsActivating,
        connectMetaMask,
        createEmbeddedWallet,
        importPrivateKey,
        activateCard,
        sendCardPayment,
        deactivateCard,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
