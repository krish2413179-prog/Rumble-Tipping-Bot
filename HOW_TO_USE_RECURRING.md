# How to Use Recurring Payments

## Quick Start

### 1. Add Contract Address to .env.local
```bash
RECURRING_PAYMENT_CONTRACT=0xD81e9690c2196b41345EC63152a59861AcE40Bfc
```

### 2. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Use Natural Language Commands

In the dashboard, type in the "Natural Language Command" box:

**Examples:**
- `tip 2 USDT every 5 minutes`
- `tip 1 USDT every 2 minutes`
- `tip 5 USDT every 10 minutes`

### 4. What Happens

**Step 1: Approve (First Transaction)**
- Trust Wallet pops up
- You're approving the RecurringPayment contract to spend USDT
- This allows automatic payments
- Click "Confirm"

**Step 2: Create Schedule (Second Transaction)**
- Trust Wallet pops up again
- You're creating the recurring payment schedule
- Click "Confirm"

**Step 3: Automatic Payments**
- After the interval (e.g., 5 minutes), the payment becomes "due"
- Anyone can trigger the payment by calling the contract
- The contract transfers USDT from your wallet to the recipient
- This repeats every interval

### 5. How Payments Get Triggered

**Option A: Manual Trigger (You)**
In browser console:
```javascript
const ethereum = window.ethereum;
const RECURRING = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';
const scheduleId = 0; // your schedule ID
const userAddress = 'YOUR_WALLET_ADDRESS';

// executePayment(uint256,address) selector = 0x4e71d92d
const data = '0x4e71d92d' + 
  scheduleId.toString(16).padStart(64, '0') +
  userAddress.slice(2).padStart(64, '0');

await ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: userAddress,
    to: RECURRING,
    data,
    chainId: '0xaa36a7',
  }],
});
```

**Option B: Automatic Trigger (Backend)**
The backend can check every minute and trigger payments:
```bash
# Call the API endpoint
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_recurring_payment",
    "payload": {
      "scheduleId": 0,
      "userAddress": "0xYourAddress"
    }
  }'
```

**Option C: Anyone Can Trigger**
Since the contract is permissionless, any address can call `executePayment()` if the payment is due.

### 6. Check Payment Status

**In Remix:**
1. Go to https://remix.ethereum.org/
2. Load contract at `0xD81e9690c2196b41345EC63152a59861AcE40Bfc`
3. Call `isPaymentDue(scheduleId, userAddress)`
4. Returns `true` if payment can be executed

**Via API:**
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check_payment_due",
    "payload": {
      "scheduleId": 0,
      "userAddress": "0xYourAddress"
    }
  }'
```

### 7. Cancel Recurring Payment

**In Remix:**
1. Connect your wallet
2. Call `cancelSchedule(scheduleId)`
3. Confirm transaction

**In Browser Console:**
```javascript
const RECURRING = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';
const scheduleId = 0;

// cancelSchedule(uint256) selector = 0x2a47d7e4
const data = '0x2a47d7e4' + scheduleId.toString(16).padStart(64, '0');

await ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: walletAddress,
    to: RECURRING,
    data,
    chainId: '0xaa36a7',
  }],
});
```

## Troubleshooting

### "Insufficient allowance" error
- You need to approve the contract first
- Go back and approve more USDT

### "Too soon" error
- The interval hasn't passed yet
- Wait for the full interval (e.g., 5 minutes)

### "Schedule not found" error
- Wrong schedule ID
- Check the transaction receipt from `createSchedule` to get the correct ID

### Payment not executing automatically
- You need to manually trigger it OR
- Set up a cron job to call `executePayment()` every minute

## Advanced: Auto-Execute with Cron

Create `scripts/execute-recurring.mjs`:
```javascript
import { ethers } from 'ethers';

const RECURRING = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';
const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
const wallet = ethers.Wallet.fromPhrase(process.env.TETHER_SEED).connect(provider);

const contract = new ethers.Contract(RECURRING, [
  'function executePayment(uint256 scheduleId, address user)',
  'function isPaymentDue(uint256 scheduleId, address user) view returns (bool)'
], wallet);

async function checkAndExecute(scheduleId, userAddress) {
  const isDue = await contract.isPaymentDue(scheduleId, userAddress);
  if (isDue) {
    console.log(`Payment due for schedule ${scheduleId}, executing...`);
    const tx = await contract.executePayment(scheduleId, userAddress);
    await tx.wait();
    console.log(`Executed: ${tx.hash}`);
  }
}

// Check schedule 0 for user
checkAndExecute(0, '0xYourUserAddress').catch(console.error);
```

Run every minute:
```bash
# Linux/Mac crontab
* * * * * cd /path/to/project && node scripts/execute-recurring.mjs

# Or use node-cron in your app
```

## Summary

1. Type "tip X USDT every Y minutes" in dashboard
2. Approve contract (once)
3. Create schedule (once)
4. Payments execute automatically when triggered
5. Cancel anytime with `cancelSchedule()`
