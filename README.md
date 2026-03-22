# OpenClaw Tipping Bot

> AI-powered autonomous tipping agent for Rumble livestreams. Type a plain English command — the agent handles everything on-chain.

**Live demo:** https://rumble-tipping-bot.vercel.app

---

## What it does

You type a command like:

- `Tip 10 USDT every 5 minutes of watch time`
- `Tip 100 USDT when viewers hit 800`
- `Tip 50 USDT every 2 minutes for 10 minutes`

The AI parses your intent, sets up an on-chain recurring schedule, and executes payments automatically — no wallet popup on every tip.

---

## How it works

1. **NLP parsing** — Gemma-2-2B via NVIDIA NIM parses your command into a structured intent `{ type, amount, asset, intervalMinutes, totalMinutes, threshold }`
2. **Single approval** — calculated precisely from the command. `"every 2 min for 10 min"` = 5 payments → approve exactly `5 × amount` USDT
3. **On-chain schedule** — `RecurringPayment.sol` stores the schedule with amount, interval, and max payments enforced by `block.timestamp`
4. **Gasless execution** — backend agent wallet calls `executePayment()` and pays gas. User's USDT is pulled via `transferFrom` — no interruption
5. **Live stats** — Rumble's `wn0` API polled every 5 seconds for real viewer count. Engagement triggers fire within seconds of threshold being crossed

---

## Trigger types

| Command | Type | Behaviour |
|---|---|---|
| `Tip 10 USDT every 5 min` | watch-time | Tips every 5 min of real watch time |
| `Tip 100 USDT when viewers hit 800` | engagement | One-shot when threshold crossed |
| `Tip 50 USDT every 2 min for 10 min` | watch-time (capped) | 5 payments, stops automatically |
| `Tip 20 USDT on 50% viewer surge` | viewer-surge | Fires on relative spike |
| `Tip 5 USDT now` | manual | Immediate transfer |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Vercel |
| AI / NLP | NVIDIA NIM — Gemma-2-2B-IT via OpenClaw SDK |
| Smart contracts | `RecurringPayment.sol`, Mock USDT (ERC-20, 6 decimals) |
| Blockchain | Ethereum Sepolia testnet |
| Wallet | MetaMask + backend agent wallet (gas only) |
| On-chain lib | ethers.js v6 |

---

## Contracts (Sepolia)

| Contract | Address |
|---|---|
| RecurringPayment | `0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf` |
| Mock USDT | `0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5` |

---

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in NVIDIA_API_KEY and TETHER_SEED
npm run dev
```

### Required env vars

```
NVIDIA_API_KEY=        # NVIDIA NIM API key — get from build.nvidia.com
TETHER_SEED=           # 12-word mnemonic for backend agent wallet (gas only)
SEPOLIA_RPC_URL=       # e.g. https://ethereum-sepolia-rpc.publicnode.com
USDT_CONTRACT_ADDRESS= # 0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5
RECURRING_CONTRACT=    # 0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf
```

---

## Key design decisions

**No wallet popup per tip** — ERC-20 `approve` + `transferFrom` pattern. User approves once, agent executes on schedule. Backend wallet never holds user USDT.

**Real watch-time tracking** — 1-second ticker that pauses when the tab is hidden (`document.hidden`) or the user clicks pause. Tips count actual viewing seconds, not wall-clock time.

**Precise approvals** — approval amount is derived from the command, not hardcoded. Prevents over-approving.

**No fake data** — all stats from Rumble's real APIs. Shows `--` if unavailable.
