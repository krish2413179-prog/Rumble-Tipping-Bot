import { Contract, Wallet, JsonRpcProvider, Signer } from 'ethers';

const RECURRING_CONTRACT = process.env.RECURRING_PAYMENT_CONTRACT || '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';

const ABI = [
  'function createSchedule(address token, address recipient, uint256 amount, uint256 interval, uint256 maxPayments) returns (uint256)',
  'function executePayment(uint256 scheduleId, address user)',
  'function cancelSchedule(uint256 scheduleId)',
  'function isPaymentDue(uint256 scheduleId, address user) view returns (bool)',
  'function getSchedule(uint256 scheduleId) view returns (address token, address recipient, uint256 amount, uint256 interval, uint256 lastPayment, uint256 maxPayments, uint256 paymentCount, bool active)',
  'event ScheduleCreated(uint256 indexed scheduleId, address indexed user, address token, address recipient, uint256 amount, uint256 interval)',
  'event PaymentExecuted(uint256 indexed scheduleId, address indexed user, address recipient, uint256 amount, uint256 paymentNumber)',
];

export class RecurringPaymentManager {
  private contract: Contract;
  private hasSigner: boolean;

  constructor(signerOrProvider: Signer | JsonRpcProvider) {
    this.contract = new Contract(RECURRING_CONTRACT, ABI, signerOrProvider);
    // Check if it's a signer by checking if it's NOT a JsonRpcProvider
    this.hasSigner = !(signerOrProvider instanceof JsonRpcProvider);
    console.log('[RecurringPaymentManager] Initialized with signer:', this.hasSigner);
  }

  async executePayment(scheduleId: number, userAddress: string) {
    console.log('[RecurringPaymentManager] executePayment called - hasSigner:', this.hasSigner);
    if (!this.hasSigner) throw new Error('Wallet required for execution');
    const tx = await this.contract.executePayment(scheduleId, userAddress);
    await tx.wait();
    return tx.hash;
  }

  async isPaymentDue(scheduleId: number, userAddress: string): Promise<boolean> {
    return await this.contract.isPaymentDue(scheduleId, userAddress);
  }

  async getSchedule(scheduleId: number) {
    const [token, recipient, amount, interval, lastPayment, maxPayments, paymentCount, active] = 
      await this.contract.getSchedule(scheduleId);
    return { token, recipient, amount, interval, lastPayment, maxPayments, paymentCount, active };
  }

  getContractAddress(): string {
    return RECURRING_CONTRACT;
  }

  getABI() {
    return ABI;
  }
}
