# Rumble Agent Tipping DApp - Complete Feature Set

## 🎯 Overview
An AI-powered tipping platform built on Ethereum Sepolia with USDT, designed for Rumble creators and fans. Features autonomous agents, community pools, smart splits, and event-triggered tipping.

---

## ✅ Implemented Features

### 1. **Auto-Tipping Based on Watch Time**
- ⏱️ Tip creators automatically based on viewing duration
- Configurable intervals (5, 10, 15, 30 minutes)
- Progressive tipping with customizable amounts
- Maximum tip limits to control spending
- Real-time tracking of watch sessions

**Example:** "Tip 2 USDT every 5 minutes I watch"

### 2. **Engagement-Based Auto-Tipping**
- 📊 Trigger tips on engagement milestones:
  - **Likes milestone:** Tip when video reaches X likes
  - **Comments milestone:** Tip based on comment count
  - **Views milestone:** Tip at view thresholds
- Repeatable or one-time triggers
- Customizable thresholds and amounts

**Example:** "Tip 10 USDT when video hits 20K likes"

### 3. **Event-Triggered Tipping (Livestream Moments)**
- 📈 **Viewer Surge Detection:** Automatically tip when concurrent viewers spike by X%
- 🎯 **Milestone Detection:** Tip at specific viewer counts (1K, 5K, 10K)
- ⚡ **Real-time Monitoring:** Polls Rumble API every 60 seconds
- 🔄 **Cooldown Periods:** Prevents spam tipping

**Example:** "Tip 15 USDT on 50% viewer surge"

### 4. **Community-Driven Tipping Pools**
- 💰 Create named pools with goals and deadlines
- 👥 Multiple users contribute to shared pool
- 🎯 Transparent on-chain tracking
- 📊 Pool progress visualization
- 🏆 Contributor leaderboards
- ✅ Automatic distribution when goal reached

**Smart Contract:** `contracts/TippingPool.sol`

### 5. **Smart Splits (Multi-Recipient Payments)**
- 🔀 Split tips between multiple recipients
- 📊 Percentage-based distribution
- 🎨 Visual split builder with presets:
  - Creator + Charity (80/20)
  - Collaboration (50/50)
  - Team Split (custom percentages)
- 🔒 Immutable or updatable configurations
- ✅ Automatic validation (must sum to 100%)

**Smart Contract:** `contracts/SplitPayment.sol`

### 6. **Natural Language Configuration**
- 🤖 AI-powered prompt parsing with OpenAI GPT
- 📝 Support for complex instructions:
  - "Tip 5 USDT every 10 minutes I watch, plus 10 USDT when they hit 50K likes"
  - "Split my tips 70/30 between creator and charity"
- 🎯 Multi-action commands
- ✅ Confirmation before execution

### 7. **Ethereum Sepolia + USDT Integration**
- 🔗 Full Ethereum wallet support (MetaMask, Trust Wallet)
- 💵 USDT token integration (ERC-20)
- ⛽ ETH for gas fees
- 🔄 Automatic network switching to Sepolia
- 💰 Real-time balance tracking

### 8. **Agent Wallet Funding**
- 💸 Users fund agent wallet for autonomous tipping
- 🤖 Agent tips automatically based on configured rules
- 🔒 Secure backend wallet management with Tether WDK
- 📊 Transaction history and balance tracking

### 9. **Real-Time Activity Feed**
- 📡 Live updates of all agent actions
- 🎯 Categorized activities (tips, triggers, connections)
- ⏰ Timestamps and transaction details
- 🎨 Color-coded by activity type
- 📜 Scrollable history

### 10. **Rumble Live Stats Integration**
- 📊 Real-time fetching of:
  - Watching now (concurrent viewers)
  - Total views
  - Likes (Rumbles)
  - Comments
- 🔄 Auto-refresh every 60 seconds
- 📈 Full number display (not abbreviated)

---

## 🏗️ Technical Architecture

### Frontend
- **Framework:** Next.js 14 with React 19
- **Wallet:** Tether WDK + window.ethereum
- **Styling:** Custom CSS with glassmorphism
- **State:** React hooks (useState, useEffect)

### Backend
- **API Routes:** Next.js API routes
- **Wallet Manager:** Tether WDK (WalletManagerEvm)
- **AI Agent:** OpenClaw SDK + OpenAI GPT-3.5
- **Network:** Ethereum Sepolia testnet

### Smart Contracts
- **Language:** Solidity 0.8.20
- **Standards:** ERC-20 (USDT), OpenZeppelin
- **Contracts:**
  - `TippingPool.sol` - Community pools
  - `SplitPayment.sol` - Multi-recipient splits

### External Integrations
- **Rumble API:** Live stats fetching
- **OpenAI API:** Natural language processing
- **Sepolia RPC:** Blockchain interactions
- **USDT Contract:** 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
MetaMask or Trust Wallet
Sepolia testnet ETH (for gas)
Sepolia testnet USDT
```

### Installation
```bash
npm install
```

### Environment Variables
Create `.env.local`:
```env
TETHER_SEED=<your-mnemonic>
OPENAI_API_KEY=<your-openai-key>
CLAW_GATEWAY_TOKEN=<your-claw-token>
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

### Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📖 User Guide

### 1. Connect Wallet
- Click "Connect WDK" button
- Approve MetaMask/Trust Wallet connection
- Ensure you're on Sepolia network (auto-switch prompt)

### 2. Get Test Funds
- **USDT:** https://faucet.circle.com/
- **ETH (gas):** https://sepoliafaucet.com/

### 3. Fund Agent Wallet
- Enter amount (e.g., 50 USDT equivalent in ETH)
- Click "FUND" button
- Approve transaction in wallet
- Agent can now tip autonomously

### 4. Configure Triggers

**Quick Presets:**
- 🔔 Tip 5 USDT @ 2000 Watching
- ❤️ Tip 10 USDT @ 20K Likes
- ⏱️ Tip 2 USDT Every 5 Minutes
- 📈 Tip 15 USDT on 50% Viewer Surge

**Natural Language:**
- Type: "Tip 3 USDT every 10 minutes I watch"
- Agent parses and configures automatically

### 5. Set Recipient Address
- Enter creator's Ethereum address (0x...)
- All tips go to this address

### 6. Watch & Earn
- Agent monitors Rumble stats in real-time
- Automatically tips when triggers fire
- View activity in real-time feed

---

## 🎨 UI Components

### Main Dashboard (`TippingDashboard.tsx`)
- Wallet connection
- Balance display (USDT + ETH)
- Agent configuration
- Quick trigger buttons
- Activity feed
- Rumble video embed
- Live stats display

### Tipping Pools (`TippingPools.tsx`)
- Create new pools
- Browse active pools
- Contribute to pools
- View progress and contributors

### Split Manager (`SplitManager.tsx`)
- Visual split builder
- Add/remove recipients
- Percentage sliders
- Preset templates
- Validation

### Analytics Dashboard (`AgentAnalytics.tsx`)
- Total tipped
- Tips by category
- Top creators
- Recent activity
- Charts and graphs

---

## 🔧 API Endpoints

### `/api/agent` (POST)
**Actions:**
- `get_balance` - Get wallet balance
- `execute_tip` - Send tip to creator
- `parse_prompt` - Parse natural language
- `add_trigger` - Add new trigger
- `get_triggers` - Get all triggers
- `clear_triggers` - Remove all triggers
- `analyze_engagement` - Check if triggers should fire
- `mint_test_btc` - Get test USDT (dev only)

### `/api/rumble/stats` (GET)
**Query Params:**
- `url` - Rumble video URL

**Returns:**
```json
{
  "watching": "1,532",
  "views": "45.2K",
  "likes": "2.1K",
  "comments": "342"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Watch-Time Tipping
1. Connect wallet and fund agent with 20 USDT
2. Add trigger: "Tip 2 USDT every 5 minutes"
3. Watch Rumble livestream
4. Agent tips automatically every 5 minutes
5. View transactions in activity feed

### Scenario 2: Engagement Milestone
1. Add trigger: "Tip 10 USDT @ 20K likes"
2. Agent monitors likes count
3. When video reaches 20K likes, agent tips
4. Trigger resets if likes drop below threshold

### Scenario 3: Viewer Surge
1. Add trigger: "Tip 15 USDT on 50% surge"
2. Agent tracks baseline viewers
3. When viewers spike 50%, agent tips
4. Baseline resets to new viewer count

### Scenario 4: Community Pool
1. Create pool: "Support Creator X - Goal: 100 USDT"
2. Multiple users contribute
3. When goal reached, funds distributed
4. All on-chain and transparent

### Scenario 5: Smart Split
1. Configure split: 80% creator, 20% charity
2. Apply to all tips
3. Every tip automatically splits
4. Both recipients receive instantly

---

## 📊 Smart Contract Deployment

### TippingPool Contract
```solidity
constructor(address _usdtToken)
createPool(string name, address beneficiary, uint256 goal, uint256 durationDays)
contribute(uint256 poolId, uint256 amount)
distributeFunds(uint256 poolId)
```

### SplitPayment Contract
```solidity
constructor(address _usdtToken)
createSplit(Split[] memory splits)
executeSplit(uint256 splitId, uint256 amount)
deactivateSplit(uint256 splitId)
```

### Deployment Steps
1. Deploy USDT token contract (or use existing)
2. Deploy TippingPool with USDT address
3. Deploy SplitPayment with USDT address
4. Update frontend with contract addresses
5. Test all functions on Sepolia

---

## 🔐 Security Features

- ✅ ReentrancyGuard on all payable functions
- ✅ Input validation (addresses, amounts, percentages)
- ✅ Access control (Ownable pattern)
- ✅ Safe ERC-20 transfers
- ✅ Deadline checks for pools
- ✅ Percentage validation (must sum to 100%)

---

## 🎯 Hackathon Requirements Met

✅ **Build on Rumble's tipping wallet** - Uses USDT on Sepolia (approved by hackathon team)
✅ **Agent auto-tips based on watch time** - Implemented with configurable intervals
✅ **Agent auto-tips based on engagement** - Likes, comments, views, viewer surge
✅ **Community-driven tipping pools** - Smart contract + UI
✅ **Smart splits** - Multi-recipient payments with percentages
✅ **Event-triggered tipping** - Livestream moments, milestones, reactions
✅ **Natural language configuration** - AI-powered prompt parsing
✅ **Real-time monitoring** - Polls Rumble API every 60 seconds
✅ **Transparent on-chain** - All transactions on Sepolia

---

## 🚧 Future Enhancements

- [ ] WebSocket for real-time Rumble stats
- [ ] Mobile app (React Native)
- [ ] Multi-token support (XAUT, other ERC-20s)
- [ ] Advanced analytics with charts
- [ ] Social features (leaderboards, badges)
- [ ] Email/Discord notifications
- [ ] Mainnet deployment
- [ ] Contract audits
- [ ] Gasless transactions (meta-transactions)
- [ ] Recurring subscriptions

---

## 📝 License
MIT

## 👥 Team
Built for Tether x Rumble Hackathon

## 🔗 Links
- Demo: [Coming Soon]
- Contracts: `contracts/`
- Documentation: This file
