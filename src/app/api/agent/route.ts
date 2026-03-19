import { NextResponse } from 'next/server';
import { OpenClawAgent } from '@/lib/openclaw';
import { TetherWDK, setUsdtContract } from '@/lib/wdk';
import { RecurringPaymentManager } from '@/lib/recurring';
import { Wallet, JsonRpcProvider } from 'ethers';

// Instantiate our hackathon SDKs
const agent = new OpenClawAgent();
const wallet = new TetherWDK();

// Recurring payment manager
function getRecurringManager() {
  const seed = process.env.TETHER_SEED || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const provider = new JsonRpcProvider(rpcUrl, 11155111);
  const signer = Wallet.fromPhrase(seed).connect(provider);
  return new RecurringPaymentManager(signer);
}

export async function POST(req: Request) {
  try {
    const { action, payload } = await req.json();

    if (action === 'parse_creator_prompt') {
      // OpenClaw parses creator donation prompts
      const { prompt, creators, favorites } = payload;
      
      try {
        console.log(`[OpenClaw] Parsing creator prompt: "${prompt}"`);
        
        // Extract intent using regex patterns
        const lower = prompt.toLowerCase();
        const amountMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:usdt|usdc|usd)?/i);
        const tipAmount = amountMatch ? parseFloat(amountMatch[1]) : null;
        
        // Extract genre
        let genre = null;
        if (lower.includes('news') || lower.includes('politics') || lower.includes('commentary')) genre = 'News & Commentary';
        else if (lower.includes('crypto') || lower.includes('finance') || lower.includes('trading')) genre = 'Crypto & Finance';
        else if (lower.includes('gaming') || lower.includes('gamer') || lower.includes('pop culture')) genre = 'Gaming & Pop Culture';
        else if (lower.includes('health') || lower.includes('education') || lower.includes('philosophy')) genre = 'Health & Education';
        else if (lower.includes('comedy')) genre = 'Comedy & Politics';
        
        // Extract favorite bonus
        let favoriteBonus = null;
        const bonusMatch = prompt.match(/(\d+)%?\s*(?:more|extra|bonus)/i);
        if (bonusMatch) favoriteBonus = parseInt(bonusMatch[1]);
        else if (lower.includes('double') || lower.includes('2x')) favoriteBonus = 100;
        else if (lower.includes('triple') || lower.includes('3x')) favoriteBonus = 200;
        
        const description = `Tip ${tipAmount || 'custom'} USDT to ${genre || 'selected'} creators${favoriteBonus ? ` with ${favoriteBonus}% bonus for favorites` : ''}`;
        
        return NextResponse.json({
          success: true,
          tipAmount,
          genre,
          favoriteBonus,
          description
        });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'set_mock_usdt') {
      try {
        const { address } = payload;
        setUsdtContract(address);
        console.log(`[API] Mock USDT updated strictly to: ${address}`);
        return NextResponse.json({ success: true, address });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'mint_test_btc') {
      // Mint test tokens for demo purposes (Sepolia testnet)
      try {
        const { address, amount } = payload;
        
        console.log(`[API] Mint request for ${amount} USDT to ${address}`);
        
        // Validate Ethereum address
        if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
          return NextResponse.json({ success: false, error: 'Invalid Ethereum address' }, { status: 400 });
        }
        
        // Send test USDT from agent wallet
        const txResult = await wallet.transfer(amount, 'USDT', address);
        
        console.log(`[API] Minted ${amount} USDT to ${address}`);
        
        return NextResponse.json({ 
          success: true, 
          txHash: txResult.txHash,
          amount,
          asset: 'USDT'
        });
      } catch (e: any) {
        console.error('[API] Mint error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'analyze_engagement') {
      // Analyze current stats and check if tip should be triggered
      const analysis = await agent.analyzeEngagement(payload.stats);
      return NextResponse.json({ success: true, analysis });
    }

    if (action === 'add_trigger') {
      // Add a new trigger condition
      agent.addTrigger(payload.trigger);
      return NextResponse.json({ success: true, triggers: agent.getTriggers() });
    }

    if (action === 'get_triggers') {
      // Get all current triggers
      return NextResponse.json({ success: true, triggers: agent.getTriggers() });
    }

    if (action === 'clear_triggers') {
      // Clear all triggers
      agent.clearTriggers();
      return NextResponse.json({ success: true });
    }

    if (action === 'get_address_only') {
      // Just return the wallet address without balance check
      try {
        const address = await wallet.getAddress();
        return NextResponse.json({ success: true, address });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'parse_prompt') {
      // User typed natural language instructions
      const agentInstructions = await agent.configureTippingSkillFromPrompt(payload.prompt);
      return NextResponse.json({ success: true, instructions: agentInstructions });
    }
    
    if (action === 'execute_tip') {
      // The AI Agent or Manual click is executing a Tip
      const { amount, asset, recipient } = payload;
      
      const txResult = await wallet.transfer(amount, asset, recipient);
      
      // We can log this execution via the Agent
      await agent.executeSkill('walletExecutor', { amount, asset, recipient, txHash: txResult.txHash });
      
      return NextResponse.json(txResult);
    }

    if (action === 'sign_recurring_permit') {
      // EIP-2612: Sign permit on the backend using the WDK ethers wallet.
      // Used when browser wallet (MetaMask) is not available (Tether WDK flow).
      const { budgetUsdt, deadlineTs } = payload;
      try {
        const permitData = await wallet.signRecurringPermit({ budgetUsdt, deadlineTs });
        return NextResponse.json({ success: true, ...permitData });
      } catch (e: any) {
        console.error('[API] sign_recurring_permit failed:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'execute_transfer_from') {
      // Backend executes transferFrom after user approved spending
      const { from, to, amount, asset } = payload;
      
      try {
        const txResult = await wallet.transferFrom(from, to, amount, asset);
        return NextResponse.json({ success: true, txHash: txResult.txHash });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'execute_recurring_payment') {
      // Execute a scheduled recurring payment
      const { scheduleId, userAddress } = payload;
      
      console.log(`[API] execute_recurring_payment - Schedule ${scheduleId} for user ${userAddress}`);
      
      try {
        const recurring = getRecurringManager();
        console.log('[API] RecurringPaymentManager created');
        
        // Check if payment is due first (with retry)
        let isDue = false;
        let retries = 3;
        while (retries > 0) {
          try {
            console.log(`[API] Checking if payment is due (attempt ${4 - retries}/3)...`);
            isDue = await recurring.isPaymentDue(scheduleId, userAddress);
            console.log(`[API] Payment due check result: ${isDue}`);
            break;
          } catch (e: any) {
            retries--;
            if (retries === 0) throw e;
            console.log(`[Recurring] RPC error, retrying... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!isDue) {
          console.log('[API] Payment not due yet, skipping execution');
          return NextResponse.json({ success: false, error: 'Too soon - payment not due yet' });
        }
        
        // Execute payment (with retry)
        console.log('[API] Payment is due, executing...');
        let txHash;
        retries = 3;
        while (retries > 0) {
          try {
            txHash = await recurring.executePayment(scheduleId, userAddress);
            console.log(`[API] Payment executed successfully! TxHash: ${txHash}`);
            break;
          } catch (e: any) {
            retries--;
            if (retries === 0) throw e;
            console.log(`[Recurring] Execution error, retrying... (${retries} left): ${e.message}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        return NextResponse.json({ success: true, txHash });
      } catch (e: any) {
        console.error('[Recurring] Error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'check_payment_due') {
      // Check if a recurring payment is due
      const { scheduleId, userAddress } = payload;
      
      try {
        const recurring = getRecurringManager();
        const isDue = await recurring.isPaymentDue(scheduleId, userAddress);
        return NextResponse.json({ success: true, isDue });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'execute_category_recurring') {
      // Execute a category recurring payment and split among creators
      const { scheduleId, userAddress, creators, totalAmount } = payload;

      try {
        const seed = process.env.TETHER_SEED || '';
        const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
        const { Contract, Wallet: EthWallet, JsonRpcProvider: Provider } = await import('ethers');
        const provider = new Provider(rpcUrl, 11155111);
        const signer = EthWallet.fromPhrase(seed).connect(provider);
        const USDT = process.env.USDT_CONTRACT_ADDRESS || '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';

        const recurring = getRecurringManager();
        const isDue = await recurring.isPaymentDue(scheduleId, userAddress);
        if (!isDue) return NextResponse.json({ success: false, error: 'Too soon - payment not due yet' });

        // Execute the recurring payment (pulls totalAmount to backend wallet)
        const execTxHash = await recurring.executePayment(scheduleId, userAddress);
        console.log(`[Category Recurring] Executed schedule ${scheduleId}, tx: ${execTxHash}`);

        // Now split among creators from backend wallet
        const usdtAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const usdtContract = new Contract(USDT, usdtAbi, signer);
        const amountPerCreator = BigInt(Math.floor((totalAmount / creators.length) * 1e6));
        const splitTxHashes: string[] = [];

        for (const creatorWallet of creators) {
          try {
            const tx = await usdtContract.transfer(creatorWallet, amountPerCreator);
            await tx.wait();
            splitTxHashes.push(tx.hash);
            console.log(`[Category Recurring] Sent to ${creatorWallet}: ${tx.hash}`);
          } catch (e: any) {
            console.error(`[Category Recurring] Failed to send to ${creatorWallet}:`, e.message);
          }
        }

        return NextResponse.json({ success: true, execTxHash, splitTxHashes });
      } catch (e: any) {
        console.error('[Category Recurring] Error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    if (action === 'get_recurring_contract') {
      // Get recurring payment contract address
      const recurring = getRecurringManager();
      return NextResponse.json({ 
        success: true, 
        address: recurring.getContractAddress() 
      });
    }

    if (action === 'execute_permit_tip') {
      // EIP-2612: Backend uses a pre-signed permit to pull funds from user wallet
      // The agent wallet calls permit() + transferFrom() — no user gas needed per tip
      const { owner, recipient, amount, value, deadline, v, r, s } = payload;

      try {
        console.log(`[API] execute_permit_tip — ${amount} USDT from ${owner} to ${recipient}`);
        const txResult = await wallet.permitAndTransferFrom({
          owner,
          recipient,
          amount,
          value,
          deadline,
          v,
          r,
          s,
        });
        // Destructure to avoid duplicate 'success' key
        const { success: _ok, ...rest } = txResult;
        return NextResponse.json({ success: true, ...rest });
      } catch (e: any) {
        console.error('[API] execute_permit_tip failed:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }
    
    if (action === 'get_balance') {
      try {
        const balance = await wallet.getBalance();
        const address = await wallet.getAddress();
        console.log('[API] Bitcoin Testnet Address:', address);
        console.log('[API] Balance:', balance);
        return NextResponse.json({ success: true, balance, address });
      } catch (e: any) {
        console.error('[API] Error getting balance/address:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
