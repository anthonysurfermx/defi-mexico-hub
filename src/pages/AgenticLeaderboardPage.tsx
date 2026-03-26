// ============================================================
// AI Agent Leaderboard — Skills & MCPs ecosystem table
// Simplified: removed DeFi Llama charts (API not paid)
// Only shows the Skills Comparison Table
// ============================================================

import { Helmet } from 'react-helmet-async';
import { SkillsComparisonSection } from '@/components/agentic/SkillsComparisonSection';
import { Link } from 'react-router-dom';

export default function AgenticLeaderboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI Agent Leaderboard — Skills & MCPs | DeFi México</title>
      </Helmet>

      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-amber-500 text-2xl">🏆</span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">AI Agent Leaderboard</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            The most comprehensive directory of AI agent skills, MCPs, and tools in the crypto ecosystem.
            Compare capabilities, track adoption, and find the right tools for your agent.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/agentic-world" className="px-4 py-2 bg-green-500 text-black text-sm font-bold rounded hover:bg-green-400 transition-colors">
              DEPLOY YOUR AGENT →
            </Link>
            <Link to="/agentic-world/bobby/marketplace" className="px-4 py-2 border border-amber-500/30 text-amber-400 text-sm font-bold rounded hover:bg-amber-500/10 transition-colors">
              AGENT COMMERCE →
            </Link>
          </div>
        </div>
      </div>

      {/* Skills Table */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SkillsComparisonSection />
      </div>
    </div>
  );
}
