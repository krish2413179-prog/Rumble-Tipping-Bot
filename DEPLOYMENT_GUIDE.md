# Deployment Guide - Rumble Agent Tipping DApp

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- MetaMask wallet with Sepolia ETH
- Hardhat (for smart contracts)
- Vercel CLI (for frontend deployment)

### Required Accounts
- OpenAI API key
- OpenClaw Gateway token (optional)
- Infura/Alchemy account for RPC
- Etherscan API key (for verification)

---

## Step 1: Environment Setup

Create `.env.local` in project root:

```env
# Wallet Configuration
TETHER_SEED="your twelve word mnemonic phrase here"

# API Keys
OPENAI_API_KEY=sk-...
CLAW_GATEWAY_TOKEN=claw_...

# Blockchain Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
USDT_CONTRACT_ADDRESS=0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

# Smart Contracts (update after deployment)
TIPPING_POOL_CONTRACT=0x...
SPLIT_PAYMENT_CONTRACT=0x...

# Optional
ETHERSCAN_API_KEY=...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Deploy Smart Contracts

### Install Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### Create Hardhat Config
Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: {
        mnemonic: process.env.TETHER_SEED
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### Create Deployment Script
Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const USDT_ADDRESS = "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06";

  // Deploy TippingPool
  console.log("Deploying TippingPool...");
  const TippingPool = await hre.ethers.getContractFactory("TippingPool");
  const tippingPool = await TippingPool.deploy(USDT_ADDRESS);
  await tippingPool.waitForDeployment();
  console.log("TippingPool deployed to:", await tippingPool.getAddress());

  // Deploy SplitPayment
  console.log("Deploying SplitPayment...");
  const SplitPayment = await hre.ethers.getContractFactory("SplitPayment");
  const splitPayment = await SplitPayment.deploy(USDT_ADDRESS);
  await splitPayment.waitForDeployment();
  console.log("SplitPayment deployed to:", await splitPayment.getAddress());

  console.log("\nUpdate your .env.local with:");
  console.log(`TIPPING_POOL_CONTRACT=${await tippingPool.getAddress()}`);
  console.log(`SPLIT_PAYMENT_CONTRACT=${await splitPayment.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploy Contracts
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### Verify Contracts (Optional)
```bash
npx hardhat verify --network sepolia TIPPING_POOL_ADDRESS USDT_ADDRESS
npx hardhat verify --network sepolia SPLIT_PAYMENT_ADDRESS USDT_ADDRESS
```

---

## Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
1. Wallet connection
2. Balance fetching
3. Trigger configuration
4. Manual tipping
5. Rumble stats fetching

---

## Step 5: Deploy Frontend to Vercel

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Deploy
```bash
vercel
```

Follow prompts:
- Link to existing project or create new
- Set project name
- Configure build settings (Next.js auto-detected)

### Set Environment Variables in Vercel
Go to Vercel Dashboard → Project → Settings → Environment Variables

Add all variables from `.env.local`:
- `TETHER_SEED`
- `OPENAI_API_KEY`
- `CLAW_GATEWAY_TOKEN`
- `SEPOLIA_RPC_URL`
- `USDT_CONTRACT_ADDRESS`
- `TIPPING_POOL_CONTRACT`
- `SPLIT_PAYMENT_CONTRACT`

### Deploy to Production
```bash
vercel --prod
```

---

## Step 6: Post-Deployment Testing

### Test Checklist
- [ ] Wallet connects successfully
- [ ] Network switches to Sepolia
- [ ] Balance displays correctly
- [ ] Can fund agent wallet
- [ ] Triggers can be added
- [ ] Manual tips work
- [ ] Rumble stats fetch correctly
- [ ] Activity feed updates
- [ ] Smart contracts are accessible
- [ ] All API endpoints respond

### Test Transactions
1. Get Sepolia ETH from faucet
2. Get test USDT from Tether's official faucet (call `_giveMeATokens` on contract)
3. Fund agent wallet with small amount
4. Configure a trigger
5. Execute a manual tip
6. Verify transaction on Etherscan

---

## Step 7: Monitor and Maintain

### Monitoring
- Check Vercel logs for errors
- Monitor Etherscan for contract interactions
- Track OpenAI API usage
- Monitor wallet balance

### Maintenance
- Update dependencies regularly
- Monitor gas prices
- Backup wallet seed phrase securely
- Update contract addresses if redeployed

---

## Troubleshooting

### Issue: Wallet won't connect
**Solution:** Ensure MetaMask is installed and Sepolia network is added

### Issue: Transaction fails
**Solution:** Check you have enough ETH for gas fees

### Issue: Balance shows 0
**Solution:** Verify USDT contract address is correct and you have test USDT

### Issue: Triggers not firing
**Solution:** Check agent is enabled and wallet is funded

### Issue: Rumble stats not fetching
**Solution:** Verify video URL is correct and API endpoint is accessible

---

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use strong mnemonic phrase
- [ ] Rotate API keys regularly
- [ ] Enable 2FA on all accounts
- [ ] Audit smart contracts before mainnet
- [ ] Use hardware wallet for mainnet
- [ ] Set spending limits on agent wallet
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated
- [ ] Use HTTPS only

---

## Mainnet Deployment (Future)

### Differences from Testnet
1. Use mainnet RPC URL
2. Use real USDT contract address
3. Audit all smart contracts
4. Test extensively on testnet first
5. Use hardware wallet for deployment
6. Set up monitoring and alerts
7. Have emergency pause mechanism
8. Purchase insurance if available

### Mainnet Checklist
- [ ] Complete security audit
- [ ] Test all features on testnet
- [ ] Prepare emergency response plan
- [ ] Set up monitoring and alerts
- [ ] Document all contract addresses
- [ ] Verify all contracts on Etherscan
- [ ] Announce deployment to community
- [ ] Monitor closely for first 48 hours

---

## Support

For issues or questions:
- Check documentation
- Review error logs
- Test on testnet first
- Contact hackathon support

---

## Useful Links

- Sepolia Faucet: https://sepoliafaucet.com/
- Tether USDT Faucet: https://sepolia.etherscan.io/address/0x7169d38820dfd117c3fa1f22a697dBA58d90BA06#writeContract
- Etherscan Sepolia: https://sepolia.etherscan.io/
- Vercel Docs: https://vercel.com/docs
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin: https://docs.openzeppelin.com/
