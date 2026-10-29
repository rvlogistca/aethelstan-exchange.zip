import { BrowserProvider, formatEther, formatUnits, Contract } from 'ethers';

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const USTD_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

export class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error('MetaMask / carteira Web3 não encontrada');
    }

    this.provider = new BrowserProvider(window.ethereum);
    await this.provider.send('eth_requestAccounts', []);
    this.signer = await this.provider.getSigner();
    this.address = await this.signer.getAddress();
    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);

    // Listeners
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
        window.dispatchEvent(new CustomEvent('wallet:disconnected'));
      } else {
        this.address = accounts[0];
        window.dispatchEvent(new CustomEvent('wallet:changed', { detail: { address: this.address } }));
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    return {
      address: this.address,
      chainId: this.chainId
    };
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
  }

  isConnected() {
    return !!this.address;
  }

  shortAddress(addr = this.address) {
    if (!addr) return '—';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  async getEthBalance(address = this.address) {
    if (!this.provider || !address) return 0n;
    return await this.provider.getBalance(address);
  }

  async getTokenBalance(contractAddress, address = this.address, decimals = 18) {
    if (!this.provider || !address) return 0n;
    const contract = new Contract(contractAddress, USDT_ABI, this.provider);
    return await contract.balanceOf(address);
  }

  formatEth(wei) {
    return formatEther(wei);
  }

  formatToken(amount, decimals = 18) {
    return formatUnits(amount, decimals);
  }
}

export const wallet = new WalletManager();
