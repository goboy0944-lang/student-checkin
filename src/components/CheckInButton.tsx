"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import WalletSelector from "./WalletSelector";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "@/idl/student_checkin.json";

interface BNLike {
  toNumber(): number;
}

type CheckInRecord = {
  name: string;
  totalCheckIns: number;
  streak: number;
  lastCheckInDay: BNLike;
  checkedInAt: BNLike;
};

const SECONDS_PER_DAY = 86_400;

function toDayLabel(day: BNLike): string {
  const ms = day.toNumber() * SECONDS_PER_DAY * 1000;
  return new Date(ms).toLocaleDateString();
}

export default function CheckInButton() {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<CheckInRecord | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!anchorWallet || !publicKey) {
      setRecord(null);
      return;
    }

    const provider = new AnchorProvider(connection, anchorWallet, {});
    const program = new Program(idl as Idl, provider);

    const [pda] = PublicKey.findProgramAddressSync(
      [publicKey.toBuffer()],
      program.programId,
    );

    const data = await (
      program.account as unknown as {
        checkInRecord: { fetchNullable: (addr: PublicKey) => Promise<CheckInRecord | null> };
      }
    ).checkInRecord.fetchNullable(pda);
    setRecord(data ?? null);
  }, [anchorWallet, publicKey, connection]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

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
      await fetchRecord();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Check In</h2>
        <WalletSelector />
      </div>

      {record ? (
        <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: 8 }}>
          <p style={{ margin: 0 }}>
            <strong>{record.name}</strong>
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            Streak: <strong>{record.streak} day{record.streak === 1 ? "" : "s"}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Total check-ins: {record.totalCheckIns} · Last: {toDayLabel(record.lastCheckInDay)}
          </p>
        </div>
      ) : (
        <p style={{ margin: "1rem 0", color: "#888" }}>
          {connected ? "No check-in record yet for this wallet." : "Connect your wallet to see your streak."}
        </p>
      )}

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