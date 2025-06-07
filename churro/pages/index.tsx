
import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-900 text-white px-6 py-10">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">LootBazaar</h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow">
          Connect Wallet
        </button>
      </header>

      <section className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-4">Trade. Stake. Loot.</h2>
        <p className="text-gray-300 text-lg mb-6">
          LootBazaar is a meme token launchpad where users can trade, stake, and earn NFT badges for community recognition.
        </p>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold transition">
          Start Trading Now
        </button>
      </section>

      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md shadow-md">
          <h3 className="text-xl font-semibold mb-2">Stake $LOOT</h3>
          <p className="text-gray-300 text-sm">Lock your tokens and earn rewards over time.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md shadow-md">
          <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
          <p className="text-gray-300 text-sm">Climb ranks based on your trading activity and earn badges.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md shadow-md">
          <h3 className="text-xl font-semibold mb-2">NFT Rewards</h3>
          <p className="text-gray-300 text-sm">Get custom NFT badges for your trading/staking milestones.</p>
        </div>
      </section>
    </main>
  );
}
