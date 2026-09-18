import CheckInButton from "@/components/CheckInButton";

export default function Home() {
  return (
    <main style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1>Student Check-In</h1>
      <p>Solana devnet · Anchor program</p>
      <CheckInButton />
    </main>
  );
}
