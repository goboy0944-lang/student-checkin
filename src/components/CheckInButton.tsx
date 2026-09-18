"use client";

import { useState } from "react";
import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "@/idl/student_checkin.json";

export default function CheckInButton() {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckIn() {
    if (!anchorWallet || !publicKey) return;

    setLoading(true);
    setSig(null);
    setError(null);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(idl as Idl, provider);

      const [pda] = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer()],
        program.programId,
      );

      const txSig = await program.methods
        .checkIn(name)
        .accounts({
          record: pda,
          student: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSig(txSig);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Check In</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        disabled={loading}
        style={{ display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.5rem", fontSize: "1rem" }}
      />
      <button
        onClick={handleCheckIn}
        disabled={!connected || !name || loading}
        style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: !connected || !name || loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Submitting..." : connected ? "Check In" : "Connect wallet first"}
      </button>

      {sig && (
        <p style={{ marginTop: "1rem" }}>
          Checked in! ✅<br />
          Tx:{" "}
          <a
            href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
          >
            {sig.slice(0, 8)}...
          </a>
        </p>
      )}

      {error && (
        <p style={{ marginTop: "1rem", color: "red" }}>
          Error: {error}
        </p>
      )}
    </div>
  );
}
