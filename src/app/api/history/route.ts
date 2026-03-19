import { NextResponse } from 'next/server';
import { JsonRpcProvider, Contract, id as ethersId } from 'ethers';

const RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
const BACKEND_WALLET = '0x1c1F68b0d4724274359C5B55589E65484D23a49a';

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userWallet = searchParams.get('wallet');

  try {
    const provider = new JsonRpcProvider(RPC, 11155111);
    const usdt = new Contract(USDT, ERC20_ABI, provider);

    const latestBlock = await provider.getBlockNumber();
    // Look back ~50k blocks (~7 days on Sepolia)
    const fromBlock = Math.max(0, latestBlock - 50000);

    const addresses = [BACKEND_WALLET.toLowerCase()];
    if (userWallet && userWallet !== BACKEND_WALLET) {
      addresses.push(userWallet.toLowerCase());
    }

    // Transfer event topic
    const transferTopic = ethersId('Transfer(address,address,uint256)');

    // Fetch logs where address is sender OR receiver
    const [sentLogs, receivedLogs] = await Promise.all([
      // Sent from our wallets
      provider.getLogs({
        address: USDT,
        topics: [
          transferTopic,
          addresses.map(a => '0x000000000000000000000000' + a.slice(2)),
        ],
        fromBlock,
        toBlock: 'latest',
      }),
      // Received by our wallets
      provider.getLogs({
        address: USDT,
        topics: [
          transferTopic,
          null,
          addresses.map(a => '0x000000000000000000000000' + a.slice(2)),
        ],
        fromBlock,
        toBlock: 'latest',
      }),
    ]);

    const allLogs = [...sentLogs, ...receivedLogs];

    // Deduplicate by txHash + logIndex
    const seen = new Set<string>();
    const unique = allLogs.filter(log => {
      const key = `${log.transactionHash}-${log.index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    unique.sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));

    // Fetch block timestamps in batches (max 20 unique blocks)
    const blockNums = [...new Set(unique.map(l => l.blockNumber))].slice(0, 20);
    const blockMap: Record<number, number> = {};
    await Promise.all(
      blockNums.map(async bn => {
        try {
          const block = await provider.getBlock(bn);
          if (block) blockMap[bn] = block.timestamp;
        } catch {}
      })
    );

    const txs = unique.slice(0, 50).map(log => {
      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      const value = BigInt(log.data);
      const usdtAmount = Number(value) / 1e6;

      return {
        hash: log.transactionHash,
        blockNumber: log.blockNumber,
        from,
        to,
        usdtAmount,
        timestamp: blockMap[log.blockNumber ?? 0] ?? 0,
      };
    });

    return NextResponse.json({ success: true, txs });
  } catch (e: any) {
    console.error('[History API]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
