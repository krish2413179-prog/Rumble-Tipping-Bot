# Deploy RecurringPayment Contract

## Option 1: Using Remix (Easiest)

1. Go to https://remix.ethereum.org/
2. Create new file `RecurringPayment.sol`
3. Copy the contract code from `contracts/RecurringPayment.sol`
4. Compile with Solidity 0.8.0+
5. Deploy to Sepolia:
   - Select "Injected Provider - MetaMask/Trust Wallet"
   - Connect your wallet
   - Click "Deploy"
6. Copy the deployed contract address
7. Add to `.env.local`:
   ```
   RECURRING_PAYMENT_CONTRACT=0xYourContractAddress
   ```

## Option 2: Using Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# Copy RecurringPayment.sol to contracts/
npx hardhat compile
npx hardhat run scripts/deploy-recurring.js --network sepolia
```

## Option 3: Using Script (requires solc)

```bash
npm install solc
node scripts/deploy-recurring.js
```

## After Deployment

1. Add backend wallet as executor:
   ```solidity
   contract.addExecutor(backendWalletAddress)
   ```

2. Users approve the contract to spend USDT:
   ```solidity
   mockUSDT.approve(recurringPaymentAddress, amount)
   ```

3. Create schedule:
   ```solidity
   contract.createSchedule(
     mockUSDTAddress,
     recipientAddress,
     2000000, // 2 USDT (6 decimals)
     120,     // 2 minutes
     0        // unlimited payments
   )
   ```

4. Backend executes payments:
   ```solidity
   contract.executePayment(scheduleId, userAddress)
   ```

## Contract Features

- Users approve once, backend executes multiple payments
- Configurable intervals (seconds)
- Max payment limits (optional)
- User can cancel anytime
- Only authorized executors can trigger payments
- Checks allowance before each payment
