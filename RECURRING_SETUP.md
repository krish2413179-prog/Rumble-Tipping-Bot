# RecurringPayment Contract Setup

## Contract Deployed ✅
**Address:** `0x3069c3b37EC56199FEc93A73193c22a9Dc6Acd05`  
**Network:** Sepolia Testnet  
**Explorer:** https://sepolia.etherscan.io/address/0x3069c3b37EC56199FEc93A73193c22a9Dc6Acd05

## Integration Complete ✅
- Contract helper added: `src/lib/recurring/index.ts`
- API routes added to `src/app/api/agent/route.ts`:
  - `execute_recurring_payment` - Execute scheduled payment
  - `check_payment_due` - Check if payment is due
  - `get_recurring_contract` - Get contract address

## Next Steps

### 1. Add Backend as Executor
Your backend wallet needs to be authorized to execute payments:

**In Remix:**
1. Go to deployed contract at `0x3069c3b37EC56199FEc93A73193c22a9Dc6Acd05`
2. Call `addExecutor` with your backend address: `0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0`
3. Approve transaction

**Or via ethers.js:**
```javascript
const recurring = getRecurringManager();
await recurring.addExecutor('0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0');
```

### 2. Update .env.local
Add this line:
```
RECURRING_PAYMENT_CONTRACT=0x3069c3b37EC56199FEc93A73193c22a9Dc6Acd05
```

### 3. How Users Create Recurring Tips

**Frontend Flow:**
1. User types: "tip 2 USDT every 2 minutes"
2. Dashboard calls USDT contract: `approve(recurringContract, amount * maxPayments)`
3. Dashboard calls RecurringPayment contract: `createSchedule(usdtAddress, recipient, 2000000, 120, 0)`
4. Returns `scheduleId`

**Backend Execution:**
1. Every minute, check: `isPaymentDue(scheduleId, userAddress)`
2. If true, call: `executePayment(scheduleId, userAddress)`
3. Contract executes `transferFrom(user, recipient, amount)`

## Contract Functions

### User Functions
- `createSchedule(token, recipient, amount, interval, maxPayments)` - Create recurring payment
- `cancelSchedule(scheduleId)` - Cancel recurring payment
- `getSchedule(scheduleId)` - View schedule details

### Executor Functions (Backend Only)
- `executePayment(scheduleId, userAddress)` - Execute scheduled payment
- `isPaymentDue(scheduleId, userAddress)` - Check if payment is due

### Owner Functions
- `addExecutor(address)` - Authorize executor
- `removeExecutor(address)` - Remove executor

## Example Usage

```typescript
// User creates schedule (frontend)
const USDT = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
const amount = 2000000; // 2 USDT (6 decimals)
const interval = 120; // 2 minutes
const maxPayments = 0; // unlimited

// 1. Approve contract
await usdtContract.approve(recurringContract, amount * 100); // approve 100 payments

// 2. Create schedule
const tx = await recurringContract.createSchedule(
  USDT,
  recipientAddress,
  amount,
  interval,
  maxPayments
);
const receipt = await tx.wait();
const scheduleId = receipt.events[0].args.scheduleId;

// Backend executes (every minute)
const isDue = await recurring.isPaymentDue(scheduleId, userAddress);
if (isDue) {
  await recurring.executePayment(scheduleId, userAddress);
}
```

## Testing

1. Deploy mock USDT with faucet function
2. Mint USDT to test user
3. User approves RecurringPayment contract
4. User creates schedule
5. Wait for interval
6. Backend executes payment
7. Verify balance changed
