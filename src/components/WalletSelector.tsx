"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";

const OPTIONS: { name: string; border: string }[] = [
  { name: "Phantom", border: "1.5px solid #ab9ff2" },
  { name: "MetaMask", border: "1.5px solid #f6851b" },
];

export default function WalletSelector() {
  const {
    wallets,
    wallet,
    select,
    connect,
    disconnect,
    connected,
    publicKey,
    connecting,
    disconnecting,
  } = useWallet();

  const [error, setError] = useState<string | null>(null);

  const connectRef = useRef(connect);
  connectRef.current = connect;

  const pendingConnectRef = useRef<WalletName | null>(null);
  const errorRef = useRef<{ show: (msg: string) => void }>({ show: () => {} });
  errorRef.current.show = (msg) => setError(msg);

  useEffect(() => {
    const selectedName = wallet?.adapter.name ?? null;
    if (!selectedName || pendingConnectRef.current !== selectedName) return;

    pendingConnectRef.current = null;
    connectRef.current().catch((err: unknown) => {
      errorRef.current.show(err instanceof Error ? err.message : String(err));
    });
  }, [wallet, connected]);

  function findAdapter(walletName: string) {
    return (
      wallets.find((w) => w.adapter.name === walletName) ??
      wallets.find((w) => w.adapter.name.toLowerCase().includes(walletName.toLowerCase()))
    );
  }

  async function handleConnect(walletName: string) {
    setError(null);

    if (connected && wallet?.adapter.name === walletName) return;

    if (!wallet || wallet.adapter.name !== walletName) {
      const target = findAdapter(walletName);
      if (!target) {
        setError(`${walletName} not detected. Install the ${walletName} extension in this browser, then refresh.`);
        return;
      }
      pendingConnectRef.current = target.adapter.name;
      select(target.adapter.name);
      return;
    }

    try {
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

  return (
    <div style={{ fontFamily: "sans-serif", display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {OPTIONS.map((opt) => (
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