export class Minimap {
    constructor(player) {
        this.player = player;
        this.createCanvas();
    }

    createCanvas() {
        // Create canvas dynamically inside HUD top right
        const container = document.querySelector('.hud-top-right');
        if (!container) return;

        this.wrapper = document.createElement('div');
        this.wrapper.id = 'minimap-container';
        this.wrapper.style.cssText = `
            width: 75px;
            height: 75px;
            border-radius: 50%;
            border: 2px solid #008751;
            overflow: hidden;
            background: rgba(15, 23, 42, 0.9);
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            position: relative;
        `;

        this.canvas = document.createElement('canvas');
        this.canvas.width = 150;
        this.canvas.height = 150;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.ctx = this.canvas.getContext('2d');

        this.wrapper.appendChild(this.canvas);
        container.insertBefore(this.wrapper, container.firstChild);
    }

    update() {
        if (!this.ctx || !this.player) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const center = width / 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background radar fill
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Grid lines (Abuja road network representation)
        ctx.strokeStyle = 'rgba(0, 135, 81, 0.3)';
        ctx.lineWidth = 2;
        const step = 20;
        const offsetX = (-this.player.position.x % step);
        const offsetZ = (-this.player.position.z % step);

        for (let x = offsetX; x < width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = offsetZ; y < height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw Player Marker (Green Blip)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(center, center, 5, 0, Math.PI * 2);
        ctx.fill();

        // Direction Arrow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
            center + Math.sin(this.player.mesh ? this.player.mesh.rotation.y : 0) * 12,
            center - Math.cos(this.player.mesh ? this.player.mesh.rotation.y : 0) * 12
        );
        ctx.stroke();
    }
}
