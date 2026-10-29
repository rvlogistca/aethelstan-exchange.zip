# AETHELSTAN Exchange — USTD Spot Trading

Interface completa de exchange (spot) focada no token **USTD**.

## Funcionalidades

- Gráfico **Candlestick** completo (1m / 5m / 15m / 1h)
- Order Book simulado em tempo real
- Formulário de compra/venda Spot
- Conexão de carteira Web3 (MetaMask + Ethers.js v6)
- Saldos on-chain ao vivo (ETH + USDT + USTD) via RPC público
- Dados de rede (último bloco + gas)
- Tema dark/gold profissional

## Estrutura

```
aethelstan-exchange/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── src/
│   ├── main.js                 # Lógica principal + candlestick
│   ├── style.css               # Estilos completos
│   ├── wallet/
│   │   └── wallet.js           # Ethers.js v6
│   └── services/
│       └── blockchain.js       # RPC + saldos
├── server/
│   └── server.js               # Express auxiliar
├── tests/
│   └── server.test.js
└── README.md
```

## Como rodar

```bash
cd aethelstan-exchange
npm install
cp .env.example .env
npm run dev
```

Acesse: **http://localhost:5173**

Backend (opcional):

```bash
npm run server
```

Testes:

```bash
npm test
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_RPC_URL` | Endpoint RPC Ethereum |
| `VITE_USTD_CONTRACT` | Contrato do token USTD |
| `VITE_USDT_CONTRACT` | Contrato USDT oficial |
| `VITE_RESERVE_WALLET` | Carteira de reserva |
| `PORT` | Porta do backend |

## Segurança

- Nunca coloque chaves privadas no frontend.
- RPCs usados são públicos.
- Conexão de carteira apenas para leitura + assinatura (quando implementado).
- Ordens de trade estão em **modo demo**.
- Sempre faça DYOR.

## Tecnologias

- Vite 5
- Ethers.js v6
- Express
- Canvas (Candlestick nativo)
- CSS puro

© 2026 AETHELSTAN
