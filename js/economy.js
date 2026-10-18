import { CONFIG } from './config.js';

export class EconomySystem {
    constructor() {
        this.storageKey = 'naija_life_wallet_v1';
        this.balance = this.loadBalance();
    }

    loadBalance() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved !== null) {
            const parsed = parseFloat(saved);
            if (!isNaN(parsed)) return parsed;
        }
        
        // Initial grant exactly once
        const initial = CONFIG.STARTING_BALANCE;
        this.saveBalance(initial);
        return initial;
    }

    saveBalance(amount) {
        this.balance = amount;
        localStorage.setItem(this.storageKey, amount.toString());
    }

    getBalance() {
        return this.balance;
    }

    addFunds(amount) {
        if (amount <= 0) return false;
        this.saveBalance(this.balance + amount);
        return true;
    }

    deductFunds(amount) {
        if (amount <= 0 || this.balance < amount) return false;
        this.saveBalance(this.balance - amount);
        return true;
    }

    formatNaira(amount = this.balance) {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(amount).replace('NGN', '₦');
    }
}
