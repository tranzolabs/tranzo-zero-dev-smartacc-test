"use client";

import { useWallet } from "@/lib/WalletContext";
import HomeScreen from "@/components/HomeScreen";
import LoadingScreen from "@/components/LoadingScreen";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function Page() {
  const { isLoading, isConnected } = useWallet();

  if (isLoading) return <LoadingScreen message="Creating your smart account..." />;
  if (!isConnected) return <WelcomeScreen />;
  return <HomeScreen />;
}
