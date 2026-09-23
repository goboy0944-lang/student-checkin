"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { createSolanaClient } from "@metamask/connect-solana";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
  const [ready, setReady] = useState(false);
  const [wallets] = useState(() => [new PhantomWalletAdapter()]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const client = await createSolanaClient({
          dapp: { name: "Student Check-In", url: window.location.origin },
        });
        await client.registerWallet();
      } catch (err) {
        console.error("MetaMask wallet registration failed:", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}