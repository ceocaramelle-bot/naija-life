export class InteractionSystem {
    constructor(player, world, economy, hud) {
        this.player = player;
        this.world = world;
        this.economy = economy;
        this.hud = hud;
        
        this.activeTarget = null;
        this.setupUI();
        this.bindEvents();
    }

    setupUI() {
        // Create ATM Modal HTML dynamically
        const modalHTML = `
            <div id="atm-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:1000; justify-content:center; align-items:center;">
                <div style="background:#0f172a; border:2px solid #008751; padding:24px; border-radius:16px; width:90%; max-width:350px; text-align:center; color:#fff; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                    <h2 style="color:#22c55e; margin-bottom:8px;">First Bank ATM</h2>
                    <p style="font-size:14px; color:#94a3b8; margin-bottom:20px;">Abuja Central Branch</p>
                    <div style="background:#1e293b; padding:12px; border-radius:8px; margin-bottom:20px;">
                        <span style="font-size:12px; color:#94a3b8;">Available Balance</span>
                        <div id="atm-balance-display" style="font-size:24px; font-weight:bold; color:#22c55e;">₦100,000.00</div>
                    </div>
                    <div style="display:flex; gap:10px; margin-bottom:15px;">
                        <button id="atm-withdraw" style="flex:1; background:#008751; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; font-size:14px;">Withdraw</button>
                        <button id="atm-deposit" style="flex:1; background:#3b82f6; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; font-size:14px;">Deposit</button>
                    </div>
                    <button id="atm-close" style="width:100%; background:transparent; border:1px solid #64748b; color:#94a3b8; padding:10px; border-radius:8px; font-size:14px;">Close</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.modal = document.getElementById('atm-modal');
        this.balanceDisplay = document.getElementById('atm-balance-display');

        document.getElementById('atm-close').addEventListener('click', () => {
            this.modal.style.display = 'none';
        });

        document.getElementById('atm-withdraw').addEventListener('click', () => {
            this.economy.addCash(10000);
            this.updateDisplay();
        });

        document.getElementById('atm-deposit').addEventListener('click', () => {
            if (this.economy.balance >= 10000) {
                this.economy.spendCash(10000);
                this.updateDisplay();
            }
        });
    }

    bindEvents() {
        const interactBtn = document.getElementById('btn-action');
        if (interactBtn) {
            interactBtn.addEventListener('click', () => {
                if (this.activeTarget && this.activeTarget.type === 'atm') {
                    this.openATM();
                }
            });
        }
    }

    openATM() {
        this.updateDisplay();
        this.modal.style.display = 'flex';
    }

    updateDisplay() {
        if (this.balanceDisplay) {
            this.balanceDisplay.textContent = `₦${this.economy.balance.toLocaleString()}.00`;
        }
        this.hud.update();
    }

    update() {
        if (!this.world || !this.world.interactables) return;

        // Check distance to interactables (like the ATM at x:12, z:-15)
        let nearest = null;
        let minDist = 999;

        this.world.interactables.forEach(item => {
            const dist = this.player.position.distanceTo(item.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = item;
            }
        });

        const interactBtn = document.getElementById('btn-action');
        if (nearest && minDist <= nearest.radius) {
            this.activeTarget = nearest;
            if (interactBtn) {
                interactBtn.style.borderColor = '#22c55e';
                interactBtn.style.boxShadow = '0 0 15px #22c55e';
            }
        } else {
            this.activeTarget = null;
            if (interactBtn) {
                interactBtn.style.borderColor = 'transparent';
                interactBtn.style.boxShadow = 'none';
            }
        }
    }
}
