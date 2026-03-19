'use client';

export default function WhitepaperPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: '#0a0a0f', zIndex: 10 }}>
        <a href="/" style={{ color: '#85c742', textDecoration: 'none', fontSize: '0.85rem' }}>← Dashboard</a>
        <span style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'monospace' }}>v1.0 — Sepolia Testnet</span>
      </header>

      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* Title block */}
        <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(133,199,66,0.15)', border: '1px solid rgba(133,199,66,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#85c742', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Technical Whitepaper</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2, margin: '0 0 1rem', color: '#fff' }}>
            OpenClaw Agent<br />
            <span style={{ color: '#85c742' }}>Intelligent Tipping Layer</span> for Rumble
          </h1>
          <p style={{ fontSize: '1rem', color: '#888', lineHeight: 1.7, margin: 0 }}>
            An AI-orchestrated, on-chain tipping system built on top of Rumble's existing USD₮ wallet infrastructure — adding automation, conditional logic, and personalization without replacing the native payment experience.
          </p>
        </div>

        <Section title="1. Abstract">
          <P>
            OpenClaw Agent is a non-custodial, agent-driven tipping layer that extends Rumble's native USD₮ tipping wallet with programmable, event-driven payment logic. Rather than building a standalone payments app, OpenClaw sits on top of Rumble's existing USD₮, XAUT, and BTC tipping infrastructure and uses AI agents to automate when, how much, and to whom tips are sent — based on real-time stream data.
          </P>
          <P>
            Users connect their existing wallet once, approve a spending allowance, and the agent handles the rest: executing tips on viewer milestones, recurring schedules, viewer surges, or natural language commands — all without requiring a wallet popup per transaction.
          </P>
        </Section>

        <Section title="2. Problem Statement">
          <P>
            Tipping on live streaming platforms today is entirely manual. A viewer must decide to tip, open a payment UI, enter an amount, and confirm — all while watching content. This friction means most tips never happen, even when a viewer genuinely wants to support a creator.
          </P>
          <P>
            Existing solutions either require custodial wallets (centralized risk), build entirely new payment rails (fragmented UX), or offer no programmability at all. There is no system that lets a viewer say <em style={{ color: '#85c742' }}>"tip 5 USDT every time the stream hits 1,000 viewers"</em> and have it execute automatically, trustlessly, on-chain.
          </P>
        </Section>

        <Section title="3. Design Philosophy">
          <Callout>
            Build on top of Rumble's existing USD₮, XAUT, and BTC tipping wallet — not a standalone payments app. Use agents to enhance tipping: automation, personalization, and conditional logic.
          </Callout>
          <P>
            OpenClaw does not replace Rumble's payment infrastructure. It wraps it. The user's USDT stays in their own wallet. The agent never holds funds. Every payment is a standard ERC-20 <code>transferFrom</code> call — the same primitive Rumble already uses — just triggered by an AI agent instead of a human click.
          </P>
          <P>
            This means full compatibility with Rumble's existing USD₮ (Tether), XAUT (Tether Gold), and BTC tipping flows. OpenClaw adds a programmable execution layer on top, not a competing payment system.
          </P>
        </Section>

        <Section title="4. System Architecture">
          <SubSection title="4.1 OpenClaw Agent (Orchestration Layer)">
            <P>
              The core of the system is the <strong style={{ color: '#85c742' }}>OpenClawAgent</strong> class — an AI orchestration engine that handles two responsibilities:
            </P>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: 2, color: '#aaa' }}>
              <li><strong style={{ color: '#e0e0e0' }}>Natural Language Parsing</strong> — converts plain English commands into structured <code>ParsedInstruction</code> objects using NVIDIA NIM (Gemma-2-2B-IT) via an OpenAI-compatible API, with a regex fallback for reliability.</li>
              <li><strong style={{ color: '#e0e0e0' }}>Engagement Analysis</strong> — evaluates real-time Rumble stream stats (watching count, likes, comments, views) against registered triggers every 30 seconds, firing payments when conditions are met.</li>
            </ul>
            <P>
              The agent supports the <strong style={{ color: '#00BFFF' }}>@panda-ai/claw-sdk</strong> NanoClaw gateway as a primary inference backend, falling back to NVIDIA NIM when no gateway token is configured. This dual-path design ensures the agent always has an inference path available.
            </P>
          </SubSection>

          <SubSection title="4.2 Trigger Types">
            <P>The agent supports six trigger types, all configurable via natural language:</P>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0' }}>
              {[
                ['watching_threshold', 'Fire once when live viewer count crosses a specific number', '#85c742'],
                ['likes_milestone', 'Fire once when total likes/rumbles hit a milestone', '#85c742'],
                ['watch_time', 'Fire on a recurring time interval (e.g. every 5 min)', '#00BFFF'],
                ['viewer_surge', 'Fire when viewer count spikes by a % above baseline', '#00BFFF'],
                ['comments_milestone', 'Fire when comment count crosses a threshold', '#85c742'],
                ['event-trigger', 'Fire on chat keywords or livestream moments', '#f59e0b'],
              ].map(([name, desc, color]) => (
                <div key={name as string} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
                  <code style={{ color: color as string, fontSize: '0.75rem' }}>{name as string}</code>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#666', lineHeight: 1.5 }}>{desc as string}</p>
                </div>
              ))}
            </div>
            <P>
              Threshold triggers are <strong style={{ color: '#e0e0e0' }}>one-shot</strong> — they fire exactly once when the condition is met and do not reset on drop. This prevents repeated charges if a viewer count oscillates around a threshold. Only <code>viewer_surge</code> resets its baseline after firing.
            </P>
          </SubSection>

          <SubSection title="4.3 Tether WDK (Wallet Execution Layer)">
            <P>
              The <strong style={{ color: '#85c742' }}>TetherWDK</strong> class wraps the Tether Wallet Development Kit, providing a unified interface for:
            </P>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: 2, color: '#aaa' }}>
              <li>Reading balances (USDT, XAUT, ETH) from the Sepolia network</li>
              <li>Executing <code>transfer</code> for direct sends from the backend wallet</li>
              <li>Executing <code>transferFrom</code> for agent-initiated pulls from user wallets (requires prior ERC-20 approval)</li>
              <li>Executing <code>permit + transferFrom</code> for EIP-2612 gasless approval flows</li>
            </ul>
            <P>
              The backend wallet (<code style={{ color: '#888' }}>0x1c1F...a49a</code>) holds only ETH for gas. It never holds user USDT. All USDT flows directly from the user's wallet to the recipient via <code>transferFrom</code>.
            </P>
          </SubSection>

          <SubSection title="4.4 RecurringPayment Contract">
            <P>
              Deployed at <code style={{ color: '#00BFFF' }}>0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf</code> on Sepolia, the <strong style={{ color: '#85c742' }}>RecurringPayment</strong> smart contract enables trustless scheduled payments:
            </P>
            <CodeBlock>{`function createSchedule(
  address token,      // USDT contract
  address recipient,  // creator wallet
  uint256 amount,     // per-payment amount
  uint256 interval,   // seconds between payments
  uint256 maxPayments // 0 = unlimited
) external returns (uint256 scheduleId)`}</CodeBlock>
            <P>
              The user calls <code>createSchedule</code> once (one wallet popup). The contract records the schedule on-chain. The backend then calls <code>executePayment(scheduleId, userAddress)</code> on the interval — the contract verifies timing, checks the user's ERC-20 allowance, and executes <code>transferFrom</code>. No further user interaction is needed.
            </P>
            <P>
              The contract enforces: minimum interval between payments, maximum payment count, active/inactive state, and automatic deactivation when max payments are reached.
            </P>
          </SubSection>

          <SubSection title="4.5 MockUSDT Contract (Testnet)">
            <P>
              Deployed at <code style={{ color: '#00BFFF' }}>0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5</code> on Sepolia. A full ERC-20 with:
            </P>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: 2, color: '#aaa' }}>
              <li><strong style={{ color: '#e0e0e0' }}>EIP-2612 permit</strong> — gasless approvals via off-chain signatures</li>
              <li><strong style={{ color: '#e0e0e0' }}>faucet()</strong> — mint up to 10,000 USDT per call for testing</li>
              <li>6 decimal places — identical to mainnet Tether USD</li>
            </ul>
            <P>On mainnet, this is replaced by the real Tether USD contract with no code changes required.</P>
          </SubSection>
        </Section>

        <Section title="5. Payment Flows">
          <SubSection title="5.1 Agent-Triggered Tip (transferFrom)">
            <P>The primary flow for engagement-based and threshold triggers:</P>
            <div style={{ margin: '1rem 0' }}>
              {[
                ['1', 'User connects wallet, approves backend wallet to spend N USDT (one-time, 10× trigger amount)', '#85c742'],
                ['2', 'User types: "tip 100 USDT when 1,000 viewers watching"', '#00BFFF'],
                ['3', 'OpenClaw parses → registers watching_threshold trigger (threshold: 1000, amount: 100)', '#00BFFF'],
                ['4', 'Dashboard polls Rumble stats every 30s via /api/rumble/stats', '#888'],
                ['5', 'When watching ≥ 1000: agent calls execute_transfer_from on backend', '#f59e0b'],
                ['6', 'Backend calls USDT.transferFrom(userWallet, recipient, 100e6) — no wallet popup', '#85c742'],
              ].map(([num, text, color]) => (
                <div key={num as string} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ minWidth: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(133,199,66,0.15)', border: '1px solid rgba(133,199,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#85c742', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>{num as string}</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: color as string, lineHeight: 1.6 }}>{text as string}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="5.2 Recurring Payment Flow">
            <P>For scheduled recurring tips (e.g. "tip 2 USDT every 5 minutes"):</P>
            <div style={{ margin: '1rem 0' }}>
              {[
                ['1', 'User approves RecurringPayment contract to spend USDT (one wallet popup)', '#85c742'],
                ['2', 'User calls createSchedule on-chain (second wallet popup)', '#85c742'],
                ['3', 'Backend polls every 60s, calls isPaymentDue(scheduleId, userAddress)', '#888'],
                ['4', 'When due: backend calls executePayment — contract pulls USDT from user, sends to recipient', '#f59e0b'],
                ['5', 'No further user interaction required until schedule is cancelled', '#00BFFF'],
              ].map(([num, text, color]) => (
                <div key={num as string} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ minWidth: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(133,199,66,0.15)', border: '1px solid rgba(133,199,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#85c742', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>{num as string}</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: color as string, lineHeight: 1.6 }}>{text as string}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="5.3 Creator Group Auto-Pay">
            <P>
              The creators page extends the recurring flow to split payments across a category of creators. A single schedule is created with the backend wallet as recipient. When executed, the backend splits the total amount equally among all creators in the category via individual <code>transfer</code> calls — all in one backend execution, zero additional user popups.
            </P>
          </SubSection>
        </Section>

        <Section title="6. Rumble Integration">
          <P>
            Live stream stats are fetched from Rumble's official API endpoint every 30 seconds:
          </P>
          <CodeBlock>{`GET /api/rumble/stats?url=<stream_url>
→ { watching, views, likes, comments }`}</CodeBlock>
          <P>
            The stats API uses Rumble's native video data endpoint with HTML scraping as a fallback. All four metrics are parsed and formatted with locale-aware number formatting (e.g. "1,624", "48.0M"). These values feed directly into the OpenClaw trigger evaluation loop.
          </P>
          <P>
            Live chat is fetched separately every 30 seconds and displayed in the dashboard's activity feed, including Rant (paid comment) detection.
          </P>
        </Section>

        <Section title="7. Security Model">
          <P>
            OpenClaw is designed around a non-custodial, minimal-trust model:
          </P>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: 2.2, color: '#aaa' }}>
            <li><strong style={{ color: '#e0e0e0' }}>No custody</strong> — the backend wallet never holds user USDT. It only holds ETH for gas.</li>
            <li><strong style={{ color: '#e0e0e0' }}>Bounded approval</strong> — <code>ensureBackendApproval</code> approves exactly 10× the trigger amount, not unlimited. Users can revoke at any time via any ERC-20 approval manager.</li>
            <li><strong style={{ color: '#e0e0e0' }}>On-chain enforcement</strong> — the RecurringPayment contract enforces timing and limits on-chain. The backend cannot execute payments faster than the configured interval.</li>
            <li><strong style={{ color: '#e0e0e0' }}>One-shot triggers</strong> — threshold triggers fire exactly once. The agent cannot double-charge on the same condition.</li>
            <li><strong style={{ color: '#e0e0e0' }}>User-controlled</strong> — users can stop auto-execution, cancel schedules, or revoke ERC-20 approval at any time.</li>
          </ul>
        </Section>

        <Section title="8. Tech Stack">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0' }}>
            {[
              ['Frontend', 'Next.js 14 (App Router), React, TypeScript'],
              ['Agent SDK', '@panda-ai/claw-sdk (NanoClaw gateway)'],
              ['AI Inference', 'NVIDIA NIM — Gemma-2-2B-IT (OpenAI-compatible)'],
              ['Wallet SDK', 'Tether WDK (TetherWDK class)'],
              ['Blockchain', 'Ethereum Sepolia testnet'],
              ['Smart Contracts', 'Solidity 0.8 — RecurringPayment, MockUSDT'],
              ['Token Standard', 'ERC-20 + EIP-2612 permit'],
              ['RPC', 'ethereum-sepolia-rpc.publicnode.com'],
              ['Explorer', 'Sepolia Etherscan'],
              ['Styling', 'CSS-in-JS inline styles, Material Symbols'],
            ].map(([label, value]) => (
              <div key={label as string} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label as string}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>{value as string}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="9. Deployed Contracts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
            {[
              ['MockUSDT', '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5', 'ERC-20 + EIP-2612, 6 decimals, faucet()'],
              ['RecurringPayment', '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf', 'Trustless scheduled transferFrom executor'],
              ['Backend Wallet', '0x1c1F68b0d4724274359C5B55589E65484D23a49a', 'Gas-only wallet — never holds USDT'],
            ].map(([name, addr, desc]) => (
              <div key={name as string} style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e0e0e0' }}>{name as string}</span>
                  <a href={`https://sepolia.etherscan.io/address/${addr}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: '#00BFFF', textDecoration: 'none' }}>Etherscan ↗</a>
                </div>
                <code style={{ fontSize: '0.7rem', color: '#85c742', fontFamily: 'monospace' }}>{addr as string}</code>
                <span style={{ fontSize: '0.72rem', color: '#666' }}>{desc as string}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="10. Roadmap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['Mainnet deployment with real Tether USD', 'planned'],
              ['Multi-creator smart split contracts', 'planned'],
              ['EIP-2612 permit flow for zero-approval-popup recurring tips', 'planned'],
              ['Rumble OAuth integration for creator verification', 'planned'],
              ['Mobile wallet support (WalletConnect)', 'planned'],
              ['XAUT (Tether Gold) tipping triggers', 'planned'],
              ['Community pool contracts — fan-funded creator tips', 'planned'],
              ['OpenClaw gateway — hosted agent inference for third-party dapps', 'planned'],
            ].map(([item, status]) => (
              <div key={item as string} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(133,199,66,0.1)', border: '1px solid rgba(133,199,66,0.3)', borderRadius: '4px', color: '#85c742', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{status as string}</span>
                <span style={{ fontSize: '0.82rem', color: '#aaa' }}>{item as string}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', color: '#444', fontSize: '0.75rem' }}>
          <p>OpenClaw Agent — Built on Ethereum Sepolia Testnet</p>
          <p style={{ marginTop: '0.25rem' }}>Tether WDK · @panda-ai/claw-sdk · NVIDIA NIM · Next.js 14</p>
        </div>

      </main>
    </div>
  );
}

// ── Small layout components ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#85c742', marginBottom: '0.75rem' }}>{title}</h3>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.875rem', color: '#999', lineHeight: 1.8, marginBottom: '0.75rem' }}>{children}</p>;
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(133,199,66,0.07)', border: '1px solid rgba(133,199,66,0.25)', borderLeft: '3px solid #85c742', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', color: '#ccc', lineHeight: 1.7, fontStyle: 'italic' }}>
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1rem', fontSize: '0.75rem', color: '#85c742', overflowX: 'auto', lineHeight: 1.6, margin: '0.75rem 0', fontFamily: 'monospace' }}>
      {children}
    </pre>
  );
}
