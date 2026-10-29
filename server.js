import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'aethelstan-exchange',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// Proxy simples de RPC (opcional – evita CORS em alguns ambientes)
app.post('/api/rpc', async (req, res) => {
  const { method, params } = req.body;
  const rpcUrl = process.env.VITE_RPC_URL || 'https://ethereum.publicnode.com';

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: params || []
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Info da exchange
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'AETHELSTAN Exchange',
    pair: 'USTD/USDT',
    network: 'Ethereum Mainnet',
    contracts: {
      ustd: process.env.VITE_USTD_CONTRACT || '0x4644E1113FE1a6bA831D85cc4772b3D0c23DE655',
      usdt: process.env.VITE_USDT_CONTRACT || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      reserve: process.env.VITE_RESERVE_WALLET || '0xB0A27099582833c0Cb8C7A0565759fF145113d64'
    }
  });
});

app.listen(PORT, () => {
  console.log(`AETHELSTAN backend rodando em http://localhost:${PORT}`);
});
