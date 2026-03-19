# Implementation Plan: Rumble Agent Tipping DApp Migration to Sepolia USDT

## Overview
Migrate from Bitcoin Testnet to Ethereum Sepolia with USDT support, implementing comprehensive agent-powered tipping features for the Tether x Rumble hackathon.

---

## Phase 1: Infrastructure Migration (Ethereum Sepolia + USDT)

### 1.1 Wallet Layer Migration
**File:** `src/lib/wdk/index.ts`

**Changes:**
- Replace `WalletManagerBtc` with `WalletManagerEvm`
- Configure for Sepolia testnet (chainId: 11155111)
- Add USDT token contract integration (ERC-20)
- Implement token balance checking
- Implement token transfer methods

**USDT Sepolia Contract:** `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06` (or deploy test token)

**Key Methods:**
```typescript
- getAddress(): Promise<string>
- getBalance(asset: 'ETH' | 'USDT'): Promise<number>
- transfer(amount: number, asset: 'USDT', recipient: string): Promise<TxResult>
- approveToken(spender: string, amount: number): Promise<TxResult>
```

### 1.2 Frontend Wallet Connection
**File:** `src/app/components/TippingDashboard.tsx`

**Changes:**
- Update `handleConnectWdk()` to use `window.ethereum` (MetaMask, Trust Wallet Ethereum)
- Add network validation (ensure Sepolia)
- Add automatic network switching prompt
- Display ETH + USDT balances
- Update all BTC references to USDT

---

## Phase 2: Core Agent Features

### 2.1 Auto-Tipping Based on Watch Time
**Files:** 
- `src/lib/openclaw/index.ts`
- `src/app/components/TippingDashboard.tsx`

**Features:**
- Track cumulative watch time per user session
- Trigger tips at configurable intervals (e.g., every 5 minutes)
- Progressive tipping: increase amount based on total watch time
- Configurable thresholds: "Tip 1 USDT every 10 minutes of watching"

**Implementation:**
```typescript
interface WatchTimeTrigger {
  type: 'watch_time';
  intervalMinutes: number;
  amountPerInterval: number;
  maxTips?: number; // Optional cap
  totalTipped: number;
  lastTipTime: number;
}
```

**UI Controls:**
- Enable/disable watch-time tipping
- Set interval (5, 10, 15, 30 minutes)
- Set amount per interval
- Display total watch time and tips sent

### 2.2 Engagement-Based Auto-Tipping
**Files:**
- `src/lib/openclaw/index.ts`
- `src/app/api/rumble/stats/route.ts`

**Triggers:**
- **Likes milestone:** Tip when video reaches X likes (10K, 20K, 50K)
- **Comments milestone:** Tip when comments reach threshold
- **Viewer surge:** Tip when concurrent viewers spike by X%
- **Sentiment analysis:** Tip on positive comment keywords (optional)

**Implementation:**
```typescript
interface EngagementTrigger {
  type: 'likes_milestone' | 'comments_milestone' | 'viewer_surge';
  threshold: number;
  amount: number;
  triggered: boolean;
  repeatable: boolean; // Can trigger multiple times
}
```

**UI Controls:**
- Quick preset buttons (e.g., "Tip 5 USDT @ 10K likes")
- Custom trigger builder
- Activity feed showing when triggers fire

---

## Phase 3: Community Tipping Pools

### 3.1 Smart Contract for Tipping Pools
**New File:** `contracts/TippingPool.sol`

**Features:**
- Create named pools (e.g., "Support Creator X", "Charity Pool")
- Multiple users contribute to pool
- Pool owner/agent can distribute funds
- Transparent on-chain tracking
- Minimum contribution amounts
- Pool expiry/deadline

**Key Functions:**
```solidity
function createPool(string name, address beneficiary, uint256 goal) external
function contribute(uint256 poolId, uint256 amount) external
function distributeFunds(uint256 poolId) external onlyOwner
function getPoolBalance(uint256 poolId) external view returns (uint256)
```

### 3.2 Pool Management UI
**New File:** `src/app/components/TippingPools.tsx`

**Features:**
- Create new pool with name, goal, beneficiary
- Browse active pools
- Contribute to pools
- View pool progress (raised/goal)
- Agent auto-distributes when goal reached
- Pool leaderboard (top contributors)

**UI Sections:**
- "Active Pools" grid
- "Create Pool" modal
- "My Contributions" history
- Pool detail page with contributors list

---

## Phase 4: Smart Splits

### 4.1 Split Contract
**New File:** `contracts/SplitPayment.sol`

**Features:**
- Define multiple recipients with percentages
- Automatic split on tip receipt
- Support for creators, collaborators, causes
- Immutable or updatable splits
- Minimum split percentage validation

**Example:**
```solidity
struct Split {
  address recipient;
  uint256 percentage; // basis points (10000 = 100%)
}

function createSplit(Split[] memory splits) external returns (uint256 splitId)
function executeSplit(uint256 splitId, uint256 amount) external
```

### 4.2 Split Management UI
**New File:** `src/app/components/SplitManager.tsx`

**Features:**
- Create split configurations
- Visual split builder (drag percentages)
- Preset templates:
  - "Creator + Charity" (80/20)
  - "Collaboration" (50/50)
  - "Team Split" (custom percentages)
- Apply split to tips
- Split history and analytics

**UI Elements:**
- Percentage slider for each recipient
- Add/remove recipient buttons
- Visual pie chart of split
- "Apply to all tips" toggle

---

## Phase 5: Event-Triggered Tipping

### 5.1 Livestream Moment Detection
**Files:**
- `src/lib/openclaw/index.ts`
- `src/app/api/rumble/events/route.ts` (new)

**Event Types:**
- **Viewer milestones:** 1K, 5K, 10K concurrent viewers
- **Engagement spikes:** Sudden increase in likes/comments
- **Stream duration:** Every hour of streaming
- **Chat keywords:** Detect specific phrases in comments
- **Reactions:** High reaction rate in short time

**Implementation:**
```typescript
interface LivestreamEvent {
  type: 'viewer_milestone' | 'engagement_spike' | 'duration' | 'keyword' | 'reaction';
  condition: any;
  tipAmount: number;
  cooldown?: number; // Prevent spam
  lastTriggered?: number;
}
```

### 5.2 Real-Time Event Monitoring
**Features:**
- WebSocket or polling for live stats
- Event detection algorithm
- Cooldown periods to prevent spam
- Event notification in activity feed
- Configurable sensitivity

**UI Controls:**
- Event trigger builder
- Enable/disable specific events
- Set cooldown periods
- Event history log

---

## Phase 6: Enhanced Agent Intelligence

### 6.1 Natural Language Configuration
**File:** `src/lib/openclaw/index.ts`

**Improvements:**
- Better prompt parsing with GPT-4
- Support complex instructions:
  - "Tip 5 USDT every 10 minutes I watch, plus 10 USDT when they hit 50K likes"
  - "Split my tips 70/30 between creator and charity"
  - "Create a pool with 100 USDT goal for this creator"
- Multi-action commands
- Confirmation before execution

### 6.2 Agent Analytics Dashboard
**New File:** `src/app/components/AgentAnalytics.tsx`

**Metrics:**
- Total USDT tipped
- Tips by category (watch-time, engagement, events)
- Most triggered events
- Pool contributions
- Split distributions
- ROI metrics (engagement per USDT)

**Visualizations:**
- Line chart: Tips over time
- Pie chart: Tip distribution by type
- Bar chart: Top creators tipped
- Activity timeline

---

## Phase 7: Advanced Features

### 7.1 Conditional Tipping Rules
**Features:**
- "Only tip if viewer count > 1000"
- "Tip 2x amount during peak hours"
- "Stop tipping after spending 50 USDT"
- Budget limits per day/week/month
- Whitelist/blacklist creators

### 7.2 Social Features
**Features:**
- Share tipping configurations
- Import community presets
- Leaderboard of top tippers
- Badges for milestones
- Tip matching (platform matches user tips)

### 7.3 Notifications
**Features:**
- Browser notifications when agent tips
- Email summaries (daily/weekly)
- Discord/Telegram webhooks
- Transaction confirmations

---

## Implementation Order

### Week 1: Foundation
1. ✅ Migrate to Ethereum Sepolia
2. ✅ Integrate USDT token
3. ✅ Update wallet connection
4. ✅ Test basic transfers

### Week 2: Core Agent Features
5. ✅ Watch-time auto-tipping
6. ✅ Engagement triggers (likes, comments, viewers)
7. ✅ Event detection system
8. ✅ Enhanced activity feed

### Week 3: Advanced Features
9. ✅ Deploy tipping pool contract
10. ✅ Build pool management UI
11. ✅ Deploy split payment contract
12. ✅ Build split manager UI

### Week 4: Polish & Testing
13. ✅ Agent analytics dashboard
14. ✅ Natural language improvements
15. ✅ Comprehensive testing
16. ✅ Documentation & demo video

---

## Technical Stack

### Smart Contracts
- Solidity 0.8.x
- Hardhat for development
- OpenZeppelin contracts
- Sepolia testnet deployment

### Frontend
- Next.js 14 (existing)
- React 19 (existing)
- Ethers.js v6 (existing)
- TailwindCSS or existing styles

### Backend
- Next.js API routes (existing)
- OpenClaw agent (existing)
- Tether WDK (existing)

### External APIs
- Rumble stats API (existing)
- OpenAI GPT-4 (existing)
- Sepolia RPC (Infura/Alchemy)

---

## Environment Variables Needed

```env
# Existing
TETHER_SEED=<mnemonic>
OPENAI_API_KEY=<key>
CLAW_GATEWAY_TOKEN=<token>

# New
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<project-id>
USDT_CONTRACT_ADDRESS=0x7169D38820dfd117C3FA1f22a697dBA58d90BA06
TIPPING_POOL_CONTRACT=<deployed-address>
SPLIT_PAYMENT_CONTRACT=<deployed-address>
```

---

## Success Metrics

1. ✅ Users can connect MetaMask/Trust Wallet (Ethereum)
2. ✅ Agent auto-tips based on watch time
3. ✅ Agent auto-tips on engagement milestones
4. ✅ Users can create and contribute to tipping pools
5. ✅ Users can configure split payments
6. ✅ Agent detects and responds to livestream events
7. ✅ All transactions use USDT on Sepolia
8. ✅ Natural language configuration works
9. ✅ Analytics dashboard shows insights
10. ✅ Demo video showcases all features

---

## Risk Mitigation

### Gas Costs
- Batch transactions where possible
- Use efficient contract patterns
- Provide gas estimates before transactions

### Agent Reliability
- Fallback to manual tipping if agent fails
- Clear error messages
- Transaction retry logic

### Security
- Input validation on all user inputs
- Rate limiting on API endpoints
- Secure seed phrase storage
- Contract audits (if time permits)

---

## Demo Scenario

**User Journey:**
1. Connect MetaMask to Sepolia
2. Get test USDT from faucet
3. Fund agent wallet with 50 USDT
4. Configure: "Tip 1 USDT every 5 minutes I watch"
5. Add trigger: "Tip 5 USDT when video hits 10K likes"
6. Create tipping pool: "Support Creator X - Goal: 100 USDT"
7. Configure split: 80% creator, 20% charity
8. Watch livestream
9. Agent automatically tips based on rules
10. View analytics dashboard showing all activity

---

## Next Steps

1. **Approve this plan** - Confirm all features align with hackathon goals
2. **Start Phase 1** - Migrate to Sepolia + USDT
3. **Iterative development** - Build and test each phase
4. **User testing** - Get feedback on UX
5. **Final polish** - Prepare demo and documentation

Ready to start implementation? 🚀
