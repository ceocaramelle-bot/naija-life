export class HUD {
    constructor(economy) {
        this.economy = economy;
        this.balanceEl = document.getElementById('player-balance');
        this.clockEl = document.getElementById('game-clock');

        this.updateBalance();
        this.startClock();
    }

    updateBalance() {
        if (this.balanceEl) {
            this.balanceEl.textContent = this.economy.formatNaira();
        }
    }

    startClock() {
        setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                timeZone: 'Africa/Lagos',
                hour: '2-digit',
                minute: '2-digit'
            });
            if (this.clockEl) {
                this.clockEl.textContent = `${timeString} • WAT`;
            }
        }, 1000);
    }
}
