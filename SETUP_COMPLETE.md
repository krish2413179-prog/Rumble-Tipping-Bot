# Setup Complete! 🎉

## Deployed Contracts

### Mock USDT Token
**Address:** `0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5`  
**Features:**
- Standard ERC-20 (transfer, approve, transferFrom)
- EIP-2612 permit (off-chain approvals)
- Faucet: mint up to 10,000 USDT per call
- 6 decimals (same as real USDT)

### RecurringPayment Contract
**Address:** `0xD81e9690c2196b41345EC63152a59861AcE40Bfc`  
**Features:**
- Permissionless execution (anyone can trigger)
- User approves once, payments happen automatically
- Configurable intervals and max payments
- User can cancel anytime

## How to Use

### 1. Get Test USDT
- Click "Mint 10K USDT" button in dashboard
- Or call `faucet(10000000000)` on Mock USDT contract

### 2. Set Up Recurring Payment
Type in Natural Language Command box:
```
tip 2 USDT every 2 minutes
```

This will:
1. Pop up Trust Wallet for approval (approve RecurringPayment contract)
2. Pop up Trust Wallet again to create schedule
3. Done! Payments will execute every 2 minutes

### 3. Trigger Payments
After 2 minutes, anyone can trigger the payment:

**Option A: Browser Console**
```javascript
const ethereum = window.ethereum;
const RECURRING = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';
const scheduleId = 0;
const userAddress = ethereum.selectedAddress;

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

**Option B: Remix**
1. Load RecurringPayment contract
2. Call `executePayment(scheduleId, userAddress)`

### 4. Check Status
In Remix, call:
- `isPaymentDue(scheduleId, userAddress)` - Returns true if payment can be executed
- `getSchedule(scheduleId)` - View schedule details

### 5. Cancel
In Remix, call:
- `cancelSchedule(scheduleId)` - Stop recurring payments

## Testing Checklist

- [x] Mock USDT deployed
- [x] RecurringPayment contract deployed
- [x] Dashboard updated to use mock USDT
- [x] Mint button updated (10K USDT faucet)
- [ ] Test: Mint USDT
- [ ] Test: Create recurring schedule
- [ ] Test: Execute payment after interval
- [ ] Test: Cancel schedule

## Next Steps

1. Restart dev server if not already done
2. Click "Mint 10K USDT" to get test tokens
3. Type "tip 2 USDT every 2 minutes"
4. Wait 2 minutes and trigger payment manually
5. Check balance decreased by 2 USDT

## Troubleshooting

**"Execution reverted" on approval:**
- Make sure you have ETH for gas
- Check you're on Sepolia network
- Verify mock USDT address is correct

**Payment not executing:**
- Check if 2 minutes passed
- Call `isPaymentDue()` to verify
- Make sure you have enough USDT balance
- Ensure approval is still valid

**Balance not updating:**
- Click refresh button
- Check transaction on Sepolia Etherscan
- Verify recipient address is correct
