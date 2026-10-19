// Local save + wallet for the Phase 1 prototype.
// IMPORTANT: this is stored on the player's own device, so it is NOT secure or server-authoritative.
// Phase 8 moves money to a server; until then this only protects against accidental duplicates.
const KEY = 'naijalife.save.v1';
export const START_BALANCE = 100000;
export const STARTER_TX_ID = 'starter-bonus';

export function formatNaira(n) {
  const sign = n < 0 ? '-' : '';
  return sign + '₦' + Math.abs(Math.round(n)).toLocaleString('en-US');
}

function defaults() {
  return {
    v: 1,
    createdAt: Date.now(),
    starterGranted: false,
    wallet: { balance: 0 },
    transactions: [],
    inventory: { suya: 0 },
    player: null,
    appearance: { skin: '#8d5524', shirt: '#1f8a4c', pants: '#26303a', hair: '#15110e' },
    settings: { sens: 1 }
  };
}

function valid(d) {
  return d && typeof d === 'object' && d.v === 1 && d.wallet && Number.isFinite(d.wallet.balance) &&
    Array.isArray(d.transactions) && d.inventory && typeof d.inventory === 'object';
}

export class Store {
  constructor() { this.data = null; this.persistent = true; this.notice = ''; this._n = 0; }

  load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); }
    catch (e) { this.persistent = false; this.notice = 'Saving is blocked in this browser, so progress will not be kept.'; }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (valid(parsed)) {
          this.data = Object.assign(defaults(), parsed);
          this.data.settings = Object.assign({ sens: 1 }, parsed.settings);
          this.data.appearance = Object.assign(defaults().appearance, parsed.appearance);
          this.data.inventory = Object.assign({ suya: 0 }, parsed.inventory);
          return 'loaded';
        }
        throw new Error('invalid save shape');
      } catch (e) {
        // Never silently destroy a save: keep a backup copy of whatever was there.
        try { localStorage.setItem(KEY + '.corrupt.' + Date.now(), raw); } catch (_) {}
        this.notice = 'Your old save could not be read. A backup copy was kept and a new save was started.';
      }
    }
    this.data = defaults();
    this._grantStarter();
    this.save();
    return raw ? 'recovered' : 'new';
  }

  // One-time rule: the bonus is granted only if it has never been recorded.
  _grantStarter() {
    const d = this.data;
    if (d.starterGranted || d.transactions.some(t => t.id === STARTER_TX_ID)) { d.starterGranted = true; return; }
    d.starterGranted = true;
    d.wallet.balance += START_BALANCE;
    d.transactions.unshift({ id: STARTER_TX_ID, t: Date.now(), type: 'bonus', amount: START_BALANCE, desc: 'Welcome to Abuja - starting money', balanceAfter: d.wallet.balance });
  }

  _tx(type, amount, desc) {
    const d = this.data;
    d.wallet.balance += amount;
    d.transactions.unshift({ id: 'tx-' + Date.now() + '-' + (this._n++), t: Date.now(), type, amount, desc, balanceAfter: d.wallet.balance });
    if (d.transactions.length > 100) d.transactions.length = 100;
  }

  // Returns {ok:true} or {ok:false, reason}
  spend(amount, desc, type = 'purchase') {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: 'Invalid amount.' };
    if (this.data.wallet.balance < amount) return { ok: false, reason: 'Not enough money.' };
    this._tx(type, -amount, desc);
    this.save();
    return { ok: true };
  }

  save() {
    if (!this.persistent || !this.data) return false;
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); return true; }
    catch (e) { this.persistent = false; return false; }
  }

  wipe() {
    try { localStorage.removeItem(KEY); } catch (_) {}
    this.data = null;
  }
      }
