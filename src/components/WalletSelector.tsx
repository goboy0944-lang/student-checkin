"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletSelector() {
  const { wallets, select, connect, disconnect, connected, publicKey, disconnecting } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(walletName: string) {
    setError(null);
    setConnecting(true);
    try {
      await new Promise((r) => setTimeout(r, 300));

      const wall =
        wallets.find((w) => w.adapter.name.toLowerCase() === walletName.toLowerCase()) ??
        wallets.find((w) => w.adapter.name.toLowerCase().includes(walletName.toLowerCase()));

      if (!wall) {
        setError(`${walletName} not detected. Install the ${walletName} extension in this browser, then refresh.`);
        return;
      }

      select(wall.adapter.name);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setError(null);
    await disconnect();
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