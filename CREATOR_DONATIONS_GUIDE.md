# Creator Donation Hub - User Guide

## Overview
A genre-based creator donation platform powered by OpenClaw AI that allows users to tip multiple creators at once with smart split functionality.

## Features

### 1. Genre-Based Groups
- **Gaming**: ProGamer Mike, SpeedRunner Sarah, RetroGaming Dan
- **Tech**: CodeMaster Alex, TechReview Lisa
- **Music**: DJ Crypto, Indie Artist Emma
- **Education**: Prof. Blockchain, Science Sam

### 2. Favorite System
- Click any creator to mark them as a favorite (⭐)
- Favorites receive bonus percentage on top of base split
- Adjustable bonus: 0% to 200% extra

### 3. Smart Split Algorithm
```
Total Weight = (Favorites × (1 + Bonus%)) + Regular Creators
Each Creator's Share = (Their Weight / Total Weight) × Total Amount
```

**Example:**
- Total: 10 USDT
- 3 creators, 1 favorite with 50% bonus
- Regular creators: 1 weight each = 2 total
- Favorite: 1.5 weight
- Total weight: 3.5
- Regular gets: (1/3.5) × 10 = 2.86 USDT each
- Favorite gets: (1.5/3.5) × 10 = 4.29 USDT

### 4. OpenClaw AI Assistant
Natural language commands to configure tips:

**Examples:**
- "tip 20 USDT to gaming creators, give my favorites 100% more"
- "donate 50 USDT to tech genre with double bonus for favorites"
- "send 15 USDT to music creators, triple my favorites"

**What OpenClaw extracts:**
- Tip amount
- Genre filter
- Favorite bonus percentage
- Applies configuration automatically

### 5. Multi-Creator Tipping
- One transaction per creator
- All tips execute in sequence
- Shows split preview before execution
- Real-time percentage and amount calculation

## How to Use

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve MetaMask/Trust Wallet connection
   - Ensure you're on Sepolia testnet

2. **Select Genre**
   - Click genre buttons to filter creators
   - "All" shows all creators across genres

3. **Mark Favorites**
   - Click creator cards to toggle favorite status
   - Favorites show ⭐ icon and green border

4. **Configure Tip**
   - Set total USDT amount
   - Adjust favorite bonus slider (0-200%)
   - Preview split distribution

5. **Use OpenClaw (Optional)**
   - Type natural language command
   - Click "Ask AI"
   - OpenClaw configures everything automatically

6. **Execute Tip**
   - Review split preview
   - Click "Tip X Creators" button
   - Approve each transaction in wallet

## Technical Details

- **Contract**: Mock USDT on Sepolia (`0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5`)
- **Network**: Ethereum Sepolia Testnet
- **Gas**: Paid by tipper for each creator transaction
- **Minimum**: 0.01 USDT per creator (smaller amounts skipped)

## OpenClaw Integration

OpenClaw parses natural language using:
1. Regex pattern matching for amounts, genres, bonuses
2. Keyword detection (gaming, tech, music, education)
3. Multiplier extraction (double, triple, 2x, 3x)
4. Percentage parsing (50%, 100%, 200%)

The AI automatically:
- Sets tip amount
- Filters to specific genre
- Adjusts favorite bonus
- Provides confirmation message

## Access

Navigate to: `http://localhost:3001/creators`

Or click "Creator Donations" in the main dashboard navigation.
