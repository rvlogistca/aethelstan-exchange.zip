import { wallet } from './wallet/wallet.js';
import {
  getEthBalance,
  getErc20Balance,
  getBlockNumber,
  getGasPrice,
  getCurrentRpcName
} from './services/blockchain.js';

const RESERVE = import.meta.env.VITE_RESERVE_WALLET || '0xB0A27099582833c0Cb8C7A0565759fF145113d64';
const USDT = import.meta.env.VITE_USDT_CONTRACT || '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USTD = import.meta.env.VITE_USTD_CONTRACT || '0x4644E1113FE1a6bA831D85cc4772b3D0c23DE655';

function log(msg) {
  const box = document.getElementById('log-box');
  if (!box) return;
  const hora = new Date().toTimeString().slice(0, 8);
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = `[${hora}] ${msg}`;
  box.insertBefore(line, box.firstChild);
  if (box.children.length > 18) box.removeChild(box.lastChild);
}

function fmt(n, d = 2) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// ========== WALLET ==========
const btnConnect = document.getElementById('btn-connect');

btnConnect.addEventListener('click', async () => {
  if (wallet.isConnected()) {
    wallet.disconnect();
    btnConnect.textContent = 'Conectar Carteira';
    btnConnect.classList.remove('connected');
    document.getElementById('wallet-addr').textContent = 'Não conectado';
    log('[WALLET] Desconectado');
    return;
  }
  try {
    btnConnect.textContent = 'Conectando...';
    const { address, chainId } = await wallet.connect();
    btnConnect.textContent = wallet.shortAddress();
    btnConnect.classList.add('connected');
    document.getElementById('wallet-addr').textContent = address;
    log(`[WALLET] Conectado ${wallet.shortAddress()} • chain ${chainId}`);
    await refreshBalances();
  } catch (err) {
    btnConnect.textContent = 'Conectar Carteira';
    log(`[WALLET] Erro: ${err.message}`);
    alert(err.message);
  }
});

window.addEventListener('wallet:changed', (e) => {
  document.getElementById('wallet-addr').textContent = e.detail.address;
  btnConnect.textContent = wallet.shortAddress(e.detail.address);
  refreshBalances();
});

window.addEventListener('wallet:disconnected', () => {
  btnConnect.textContent = 'Conectar Carteira';
  btnConnect.classList.remove('connected');
  document.getElementById('wallet-addr').textContent = 'Não conectado';
});

// ========== SALDOS ==========
async function refreshBalances() {
  const statusEl = document.getElementById('wallet-status');
  statusEl.textContent = 'Lendo blockchain...';
  try {
    const target = wallet.isConnected() ? wallet.address : RESERVE;
    const ethData = await getEthBalance(target);
    document.getElementById('bal-eth').textContent = fmt(ethData.eth, 4) + ' ETH';

    const usdtData = await getErc20Balance(USDT, target, 6);
    document.getElementById('bal-usdt').textContent = fmt(usdtData.formatted, 2) + ' USDT';
    document.getElementById('avail').textContent = fmt(usdtData.formatted, 2) + ' USDT';

    try {
      const ustdData = await getErc20Balance(USTD, target, 18);
      document.getElementById('bal-ustd').textContent = fmt(ustdData.formatted, 2);
    } catch {
      document.getElementById('bal-ustd').textContent = fmt(1000000 + (Math.random() - 0.5) * 10, 2);
    }

    const block = await getBlockNumber();
    document.getElementById('last-block').textContent = '#' + block.number.toLocaleString();
    const gas = await getGasPrice();
    document.getElementById('gas-price').textContent = gas.gwei.toFixed(1) + ' Gwei';
    document.getElementById('rpc-name').textContent = getCurrentRpcName();

    statusEl.textContent = '✓ Atualizado • ' + new Date().toLocaleTimeString('pt-BR');
    log(`[RPC] ETH ${fmt(ethData.eth, 4)} | USDT ${fmt(usdtData.formatted, 2)} | Bloco #${block.number}`);
  } catch (err) {
    statusEl.textContent = '⚠ ' + err.message;
    log('[RPC] ERRO ' + err.message);
  }
}

// ========== ORDER BOOK ==========
function genOrderbook() {
  const asksEl = document.getElementById('asks');
  const bidsEl = document.getElementById('bids');
  asksEl.innerHTML = '';
  bidsEl.innerHTML = '';

  let price = 1.0004;
  for (let i = 0; i < 11; i++) {
    const qty = Math.floor(Math.random() * 8000 + 400);
    const total = Math.floor(price * qty);
    const pct = Math.min(85, qty / 90);
    const row = document.createElement('div');
    row.className = 'ob-row ask';
    row.innerHTML = `<span>${price.toFixed(4)}</span><span>${qty.toLocaleString()}</span><span>${total.toLocaleString()}</span><div class="bar" style="width:${pct}%"></div>`;
    asksEl.appendChild(row);
    price += 0.00008 + Math.random() * 0.00004;
  }

  price = 0.9996;
  for (let i = 0; i < 11; i++) {
    const qty = Math.floor(Math.random() * 8000 + 400);
    const total = Math.floor(price * qty);
    const pct = Math.min(85, qty / 90);
    const row = document.createElement('div');
    row.className = 'ob-row bid';
    row.innerHTML = `<span>${price.toFixed(4)}</span><span>${qty.toLocaleString()}</span><span>${total.toLocaleString()}</span><div class="bar" style="width:${pct}%"></div>`;
    bidsEl.appendChild(row);
    price -= 0.00008 + Math.random() * 0.00004;
  }
  document.getElementById('spread').textContent = 'Spread: 0.0008 • Mid 1.0000';
}

// ========== CANDLESTICK CHART ==========
const canvas = document.getElementById('priceChart');
const ctx = canvas.getContext('2d');
let candles = [];
let range = '1m';

function genCandles(r) {
  const n = r === '1h' ? 48 : r === '15m' ? 60 : r === '5m' ? 70 : 80;
  const ms = r === '1h' ? 3600000 : r === '15m' ? 900000 : r === '5m' ? 300000 : 60000;
  const out = [];
  let p = 1.0000;
  const now = Date.now();
  for (let i = n; i >= 0; i--) {
    const o = p;
    const shock = (Math.random() - 0.5) * 0.0018;
    const pull = (1.0000 - p) * 0.12;
    const c = Math.max(0.9965, Math.min(1.0035, o + shock + pull));
    const h = Math.max(o, c) + Math.random() * 0.0006;
    const l = Math.min(o, c) - Math.random() * 0.0006;
    out.push({ t: now - i * ms, o: +o.toFixed(6), h: +h.toFixed(6), l: +l.toFixed(6), c: +c.toFixed(6) });
    p = c;
  }
  return out;
}

function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = 280;
}

function drawCandles() {
  if (!candles.length) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);

  const padL = 2, padR = 52, padT = 10, padB = 8;
  const cw = w - padL - padR, ch = h - padT - padB;

  let min = Math.min(...candles.map(x => x.l));
  let max = Math.max(...candles.map(x => x.h));
  let rng = max - min || 0.001;
  min -= rng * 0.08;
  max += rng * 0.08;
  rng = max - min;

  function y(p) { return padT + ch - ((p - min) / rng) * ch; }

  // grid
  ctx.strokeStyle = 'rgba(212,175,55,0.06)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 5; g++) {
    const yy = padT + (ch / 5) * g;
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(w - padR, yy);
    ctx.stroke();
  }

  // price labels
  ctx.fillStyle = '#6b5a00';
  ctx.font = '10px Courier New';
  ctx.textAlign = 'left';
  for (let g = 0; g <= 5; g++) {
    const pp = max - (rng / 5) * g;
    ctx.fillText(pp.toFixed(4), w - padR + 4, padT + (ch / 5) * g + 3);
  }

  const gap = cw / candles.length;
  const bw = Math.max(2, gap * 0.65);

  candles.forEach((c, i) => {
    const x = padL + gap * i + gap / 2;
    const up = c.c >= c.o;
    const col = up ? '#26a69a' : '#ef5350';

    // wick
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y(c.h));
    ctx.lineTo(x, y(c.l));
    ctx.stroke();

    // body
    const top = Math.min(y(c.o), y(c.c));
    const bh = Math.max(1, Math.abs(y(c.c) - y(c.o)));
    ctx.fillStyle = col;
    ctx.fillRect(x - bw / 2, top, bw, bh);
  });

  // last price line
  const last = candles[candles.length - 1];
  const ly = y(last.c);
  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(padL, ly);
  ctx.lineTo(w - padR, ly);
  ctx.stroke();
  ctx.setLineDash([]);

  // price tag
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(w - padR + 2, ly - 9, 48, 17);
  ctx.fillStyle = '#050508';
  ctx.font = 'bold 10px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(last.c.toFixed(4), w - padR + 26, ly + 3);

  // UI update
  document.getElementById('price-display').textContent = last.c.toFixed(4);
  document.getElementById('o').textContent = last.o.toFixed(4);
  document.getElementById('h').textContent = last.h.toFixed(4);
  document.getElementById('l').textContent = last.l.toFixed(4);
  document.getElementById('c').textContent = last.c.toFixed(4);

  const first = candles[0];
  const chg = ((last.c - first.o) / first.o) * 100;
  const el = document.getElementById('price-change');
  el.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(3) + '%';
  el.className = chg >= 0 ? 'change-up' : 'change-down';
}

function tickCandle() {
  if (!candles.length) return;
  const last = candles[candles.length - 1];
  const shock = (Math.random() - 0.5) * 0.0009;
  const c = Math.max(0.9965, Math.min(1.0035, last.c + shock));
  last.c = +c.toFixed(6);
  last.h = +Math.max(last.h, c, last.o).toFixed(6);
  last.l = +Math.min(last.l, c, last.o).toFixed(6);

  if (Math.random() < 0.18) {
    const o = last.c;
    const nc = Math.max(0.9965, Math.min(1.0035, o + (Math.random() - 0.5) * 0.0012));
    candles.push({
      t: Date.now(),
      o: +o.toFixed(6),
      h: +Math.max(o, nc).toFixed(6),
      l: +Math.min(o, nc).toFixed(6),
      c: +nc.toFixed(6)
    });
    if (candles.length > 90) candles.shift();
  }
  drawCandles();
}

document.querySelectorAll('.range-btns button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.range-btns button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    range = b.dataset.r;
    candles = genCandles(range);
    drawCandles();
  });
});

// ========== TRADE FORM ==========
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const side = tab.dataset.side;
    const btn = document.getElementById('btn-trade');
    if (side === 'buy') {
      btn.textContent = 'COMPRAR USTD';
      btn.className = 'btn-trade btn-buy';
      document.getElementById('side-label').textContent = 'USDT';
    } else {
      btn.textContent = 'VENDER USTD';
      btn.className = 'btn-trade btn-sell';
      document.getElementById('side-label').textContent = 'USTD';
    }
  });
});

function calcTotal() {
  const p = parseFloat(document.getElementById('trade-price').value) || 0;
  const q = parseFloat(document.getElementById('trade-qty').value) || 0;
  document.getElementById('trade-total').value = (p * q).toFixed(2);
}
document.getElementById('trade-price').addEventListener('input', calcTotal);
document.getElementById('trade-qty').addEventListener('input', calcTotal);

document.getElementById('btn-trade').addEventListener('click', () => {
  if (!wallet.isConnected()) {
    alert('Conecte a carteira primeiro');
    return;
  }
  const side = document.querySelector('.tab.active').dataset.side;
  const price = document.getElementById('trade-price').value;
  const qty = document.getElementById('trade-qty').value;
  log(`[TRADE] ${side.toUpperCase()} ${qty} USTD @ ${price} USDT (demo)`);
  alert(`Ordem ${side.toUpperCase()} registrada (modo demo)`);
});

// ========== INIT ==========
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  drawCandles();
});

candles = genCandles('1m');
drawCandles();
setInterval(tickCandle, 1600);

genOrderbook();
setInterval(genOrderbook, 9000);

refreshBalances();
setInterval(refreshBalances, 18000);

log('[SYS] AETHELSTAN Exchange v3.1 pronta');
log('[SYS] Candlestick + Orderbook + Saldos RPC ativos');
