/**
 * Serviços de leitura on-chain via RPC público (sem chave)
 * Usado para saldos de reserva e dados de rede mesmo sem carteira conectada.
 */

const RPC_URLS = [
  import.meta.env.VITE_RPC_URL || 'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com'
];

let currentRpc = 0;

export async function rpcCall(method, params = []) {
  for (let i = 0; i < RPC_URLS.length; i++) {
    const url = RPC_URLS[(currentRpc + i) % RPC_URLS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        })
      });
      const data = await res.json();
      if (data.result !== undefined) {
        currentRpc = (currentRpc + i) % RPC_URLS.length;
        return { result: data.result, rpc: url };
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error('Todos os RPCs falharam');
}

export function hexToNumber(hex) {
  return parseInt(hex, 16);
}

export async function getEthBalance(address) {
  const { result, rpc } = await rpcCall('eth_getBalance', [address, 'latest']);
  return {
    wei: BigInt(result),
    eth: Number(BigInt(result)) / 1e18,
    rpc
  };
}

export async function getErc20Balance(contract, address, decimals = 6) {
  // balanceOf(address) selector = 0x70a08231
  const data = '0x70a08231' + address.slice(2).toLowerCase().padStart(64, '0');
  const { result, rpc } = await rpcCall('eth_call', [{ to: contract, data }, 'latest']);
  if (!result || result === '0x') {
    return { raw: 0n, formatted: 0, rpc };
  }
  const raw = BigInt(result);
  return {
    raw,
    formatted: Number(raw) / (10 ** decimals),
    rpc
  };
}

export async function getBlockNumber() {
  const { result, rpc } = await rpcCall('eth_blockNumber');
  return { number: hexToNumber(result), rpc };
}

export async function getGasPrice() {
  const { result, rpc } = await rpcCall('eth_gasPrice');
  return { gwei: hexToNumber(result) / 1e9, rpc };
}

export function getCurrentRpcName() {
  return RPC_URLS[currentRpc].replace('https://', '').split('/')[0];
}
