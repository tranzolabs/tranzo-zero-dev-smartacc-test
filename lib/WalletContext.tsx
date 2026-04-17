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
import {
  getSmartAccountAddress,
  getMetaMaskWalletClient,
  CHAIN,
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
  connectMetaMask: () => Promise<void>;
  createEmbeddedWallet: () => Promise<void>;
  importPrivateKey: (pk: string) => Promise<void>;
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

  // Restore wallet on mount
  useEffect(() => {
    restoreWallet().finally(() => setIsLoading(false));
  }, []);

  async function restoreWallet() {
    const type = localStorage.getItem(SIGNER_TYPE_KEY) as SignerType | null;
    if (type === "embedded") {
      const pk = localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;
      if (pk) await initEmbedded(pk);
    } else if (type === "metamask") {
      // Try to silently reconnect MetaMask
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
      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      });
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
    if (pk.length !== 66) {
      throw new Error("Invalid private key — must be 64 hex characters");
    }
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

  // ─── Disconnect ────────────────────────────────────────────────────────────
  function disconnect() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIGNER_TYPE_KEY);
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
        connectMetaMask,
        createEmbeddedWallet,
        importPrivateKey,
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
