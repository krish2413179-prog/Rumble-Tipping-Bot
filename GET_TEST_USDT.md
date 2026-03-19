# How to Get Test USDT (Tether Official)

This guide shows you how to get test USDT from Tether's official testnet contract on Sepolia.

---

## Contract Information

- **Contract Address:** `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- **Network:** Sepolia Testnet
- **Token:** Tether USD (USDT)
- **Decimals:** 6
- **Contract Name:** TetherToken

---

## Method 1: Using Etherscan (Easiest)

### Step 1: Visit the Contract
Go to: https://sepolia.etherscan.io/address/0x7169d38820dfd117c3fa1f22a697dBA58d90BA06#writeContract

### Step 2: Connect Your Wallet
1. Click "Connect to Web3" button
2. Approve MetaMask connection
3. Ensure you're on Sepolia network

### Step 3: Call _giveMeATokens Function
1. Scroll to function **33. _giveMeATokens**
2. Enter amount (in smallest units - 6 decimals):
   - For 100 USDT: `100000000` (100 * 10^6)
   - For 1000 USDT: `1000000000` (1000 * 10^6)
   - Maximum: `1000000000` (1000 USDT per call)
3. Click "Write" button
4. Approve transaction in MetaMask
5. Wait for confirmation

### Step 4: Verify Balance
1. Go to "Read Contract" tab
2. Call `balanceOf` with your address
3. Divide result by 1,000,000 to get USDT amount

---

## Method 2: Using Web3.js/Ethers.js

```javascript
const ethers = require('ethers');

// Connect to Sepolia
const provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.org');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// USDT Contract
const usdtAddress = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
const usdtAbi = [
  'function _giveMeATokens(uint256 amount) public',
  'function balanceOf(address account) view returns (uint256)'
];

const usdt = new ethers.Contract(usdtAddress, usdtAbi, wallet);

// Get 1000 USDT (1000 * 10^6)
async function getTestUSDT() {
  const amount = ethers.utils.parseUnits('1000', 6);
  const tx = await usdt._giveMeATokens(amount);
  await tx.wait();
  console.log('Got test USDT!', tx.hash);
  
  // Check balance
  const balance = await usdt.balanceOf(wallet.address);
  console.log('Balance:', ethers.utils.formatUnits(balance, 6), 'USDT');
}

getTestUSDT();
```

---

## Method 3: Using Cast (Foundry)

```bash
# Get 1000 USDT
cast send 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06 \
  "_giveMeATokens(uint256)" 1000000000 \
  --rpc-url https://rpc.sepolia.org \
  --private-key YOUR_PRIVATE_KEY

# Check balance
cast call 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06 \
  "balanceOf(address)(uint256)" YOUR_ADDRESS \
  --rpc-url https://rpc.sepolia.org
```

---

## Important Notes

### Limits
- Maximum per call: **1000 USDT** (1,000,000,000 units)
- You can call multiple times if needed
- No cooldown period

### Gas Fees
- You need Sepolia ETH for gas
- Get from: https://sepoliafaucet.com/
- Typical gas cost: ~0.001 ETH

### Decimals
- USDT has 6 decimals (not 18 like ETH)
- 1 USDT = 1,000,000 units
- Always multiply by 10^6 when calling contract

---

## Troubleshooting

### "Transaction Failed"
- Check you have enough Sepolia ETH for gas
- Ensure you're on Sepolia network
- Try reducing amount (max 1000 USDT)

### "Insufficient Funds"
- Get Sepolia ETH first: https://sepoliafaucet.com/
- Need at least 0.01 ETH for gas

### "Wrong Network"
- Switch MetaMask to Sepolia
- Network ID: 11155111
- RPC: https://rpc.sepolia.org

---

## Quick Reference

| Item | Value |
|------|-------|
| Contract | 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06 |
| Network | Sepolia (11155111) |
| Function | _giveMeATokens(uint256) |
| Max Amount | 1000000000 (1000 USDT) |
| Decimals | 6 |
| Gas Needed | ~0.001 ETH |

---

## Example Amounts

| USDT | Units (with 6 decimals) |
|------|------------------------|
| 1 | 1000000 |
| 10 | 10000000 |
| 100 | 100000000 |
| 1000 | 1000000000 |

---

## After Getting USDT

1. ✅ Verify balance in MetaMask
2. ✅ Add USDT token to MetaMask:
   - Token Address: 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06
   - Symbol: USDT
   - Decimals: 6
3. ✅ Use in your dApp!

---

## Official Links

- Contract on Etherscan: https://sepolia.etherscan.io/address/0x7169d38820dfd117c3fa1f22a697dBA58d90BA06
- Write Contract: https://sepolia.etherscan.io/address/0x7169d38820dfd117c3fa1f22a697dBA58d90BA06#writeContract
- Read Contract: https://sepolia.etherscan.io/address/0x7169d38820dfd117c3fa1f22a697dBA58d90BA06#readContract

---

**This is Tether's official USDT testnet contract - not Circle's USDC!** ✅
