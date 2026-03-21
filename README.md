graph TD
    A[User Watches Rumble Stream] -->|Watch Time / Chat Event| B(Next.js Frontend)
    B -->|Engagement Telemetry| C{OpenClaw Agent}
    C -->|Condition Met: Trigger Tip| D[Tether WDK Wallet]
    C -.->|Condition Not Met| B
    D -->|Sign & Broadcast Tx| E[(Sepolia Testnet: Mock USDT)]
    E -->|TxHash Confirmed| F[RPC Node Provider]
    F -->|Success Event| B
    B -->|Render UI Toast| G((Tip Sent Notification!))
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#bfb,stroke:#333,stroke-width:2px





# Rumble Agent Tipping DApp 🚀

AI-powered autonomous tipping platform for Rumble creators built with Ethereum Sepolia + USDT.

## 🎯 Features

✅ **Auto-Tipping Agent**
- Watch-time based tipping (every X minutes)
- Engagement milestones (likes, comments, views)
- Viewer surge detection (spike alerts)

✅ **Smart Features**
- Community tipping pools
- Multi-recipient payment splits
- Natural language configuration

✅ **Real-Time**
- Live Rumble stats integration
- Activity feed with transaction history
- Automatic trigger execution

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

Visit http://localhost:3000

## 📚 Documentation

- **[Get Test USDT](GET_TEST_USDT.md)** - How to get Tether's official testnet USDT
- **[Complete Features](README_FEATURES.md)** - Full feature documentation
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[Hackathon Checklist](HACKATHON_CHECKLIST.md)** - Submission prep

## 🎬 Demo

[Demo Video Coming Soon]

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, React 19
- **Wallet:** Tether WDK (WalletManagerEvm)
- **AI:** OpenClaw SDK + OpenAI GPT-3.5
- **Blockchain:** Ethereum Sepolia Testnet
- **Token:** USDT (Tether's Official Contract)
- **Smart Contracts:** Solidity 0.8.20

## 🎯 Hackathon Requirements

All requirements met for Tether x Rumble Hackathon:
- ✅ Agent auto-tips on watch time
- ✅ Agent auto-tips on engagement
- ✅ Community tipping pools
- ✅ Smart splits
- ✅ Event-triggered tipping

## 📝 License

MIT

- **[Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes
