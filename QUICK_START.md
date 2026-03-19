# Quick Start Guide - Rumble Agent Tipping DApp

Get up and running in 5 minutes! 🚀

---

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

---

## Step 2: Configure Environment (2 minutes)

Create `.env.local` in project root:

```env
# Required
TETHER_SEED="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
OPENAI_API_KEY=sk-your-key-here

# Optional (has defaults)
SEPOLIA_RPC_URL=https://rpc.sepolia.org
CLAW_GATEWAY_TOKEN=your-token-here
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- OpenClaw: https://openclaw.ai/ (optional)

---

## Step 3: Run Development Server (30 seconds)

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Step 4: Connect Wallet & Test (1 minute)

### Get Test Funds
1. **Sepolia ETH (for gas):** https://sepoliafaucet.com/
2. **Test USDT:** https://faucet.circle.com/

### Connect & Test
1. Click "Connect WDK" button
2. Approve MetaMask connection
3. Switch to Sepolia network (auto-prompt)
4. Fund agent wallet with 0.01 ETH
5. Click a quick trigger button
6. Watch the activity feed!

---

## Step 5: Try Features (1 minute)

### Quick Triggers (Click to Add)
- 🔔 Tip 5 USDT @ 2000 Watching
- ❤️ Tip 10 USDT @ 20K Likes
- ⏱️ Tip 2 USDT Every 5 Minutes
- 📈 Tip 15 USDT on 50% Viewer Surge

### Natural Language (Type & Submit)
- "Tip 2 USDT every 10 minutes I watch"
- "Tip 5 USDT when video hits 20K likes"
- "Tip 3 USDT on 100% viewer spike"

### Manual Tip
1. Set recipient address (0x...)
2. Click tip amount button
3. Approve transaction

---

## 🎯 What You Get

✅ **Auto-Tipping Agent**
- Watch-time based
- Engagement milestones
- Viewer surge detection

✅ **Smart Features**
- Community tipping pools
- Multi-recipient splits
- Natural language config

✅ **Real-Time**
- Live Rumble stats
- Activity feed
- Transaction tracking

---

## 📖 Next Steps

- **Full Features:** Read `README_FEATURES.md`
- **Deploy:** Read `DEPLOYMENT_GUIDE.md`
- **Details:** Read `IMPLEMENTATION_SUMMARY.md`

---

## 🐛 Troubleshooting

### "Cannot connect wallet"
→ Install MetaMask: https://metamask.io/

### "Wrong network"
→ Click "Switch Network" when prompted

### "Insufficient funds"
→ Get test ETH from faucet

### "Transaction failed"
→ Check you have ETH for gas fees

---

## 🎉 You're Ready!

Your agent-powered tipping platform is running!

**Test the full flow:**
1. ✅ Connect wallet
2. ✅ Get test funds
3. ✅ Fund agent
4. ✅ Add triggers
5. ✅ Watch it work!

---

## 💡 Pro Tips

- Start with small amounts (0.01 ETH)
- Test triggers one at a time
- Watch the activity feed for updates
- Check Etherscan for transaction details
- Use natural language for complex rules

---

## 🚀 Ready for Production?

Follow the deployment guide to:
- Deploy smart contracts to Sepolia
- Deploy frontend to Vercel
- Set up monitoring
- Create demo video

**Good luck with the hackathon! 🏆**
