"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
