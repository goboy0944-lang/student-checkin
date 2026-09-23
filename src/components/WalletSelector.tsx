"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";

type PendingSelect = {
  name: WalletName;
  resolve: () => void;
  reject: (err: Error) => void;
} | null;

export default function WalletSelector() {
  const { wallets, wallet, select, connect, disconnect, connected, publicKey, connecting, disconnecting } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const pendingSelectRef = useRef<PendingSelect>(null);

  // select() only updates the provider state asynchronously; connect() must
  // not run until the provider has switched adapter and attached listeners.
  useEffect(() => {
    const pending = pendingSelectRef.current;
    if (!pending) return;
    if (wallet?.adapter.name === pending.name) {
      pendingSelectRef.current = null;
      pending.resolve();
    }
  }, [wallet]);

  function selectAndWait(name: WalletName): Promise<void> {
    if (wallet?.adapter.name === name) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      pendingSelectRef.current = { name, resolve, reject };
      select(name);
      setTimeout(() => {
        if (pendingSelectRef.current) {
          pendingSelectRef.current = null;
          reject(new Error(`Timed out waiting for ${name} to be selected.`));
        }
      }, 5000);
    });
  }

  async function handleConnect(walletName: string) {
    setError(null);
    try {
      const target =
        wallets.find((w) => w.adapter.name === walletName) ??
        wallets.find((w) => w.adapter.name.toLowerCase().includes(walletName.toLowerCase()));

      if (!target) {
        setError(`${walletName} not detected. Install the ${walletName} extension in this browser, then refresh.`);
        return;
      }

      await selectAndWait(target.adapter.name);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDisconnect() {
    setError(null);
    try {
      await disconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (connected && publicKey) {
    return (
      <div style={{ fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span>
          {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", background: "none", border: "1px solid #ccc", borderRadius: 6 }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  const options: { name: string; border: string }[] = [
    { name: "Phantom", border: "1.5px solid #ab9ff2" },
    { name: "MetaMask", border: "1.5px solid #f6851b" },
  ];

  return (
    <div style={{ fontFamily: "sans-serif", display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {options.map((opt) => (
          <button
            key={opt.name}
            onClick={() => handleConnect(opt.name)}
            disabled={connecting}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              cursor: connecting ? "not-allowed" : "pointer",
              border: opt.border,
              borderRadius: 8,
              background: "#fff",
              color: "#000",
            }}
          >
            {connecting ? "Connecting..." : `Connect ${opt.name}`}
          </button>
        ))}
      </div>
      {error && <p style={{ margin: 0, color: "red", fontSize: "0.8rem" }}>{error}</p>}
    </div>
  );
}
