import * as THREE from 'three';

export class Controls {
    constructor() {
        this.inputVector = new THREE.Vector2(0, 0);
        this.cameraAngle = 0;
        this.keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

        this.setupKeyboard();
        this.setupTouchJoystick();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key) || this.keys.hasOwnProperty(e.code)) {
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key) || this.keys.hasOwnProperty(e.code)) {
                this.keys[e.key] = false;
            }
        });
    }

    setupTouchJoystick() {
        const zone = document.getElementById('joystick-zone');
        const stick = document.getElementById('joystick-stick');
        let active = false;
        let startX = 0, startY = 0;
        const maxDist = 40;

        zone.addEventListener('touchstart', (e) => {
            active = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!active) return;
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
            const angle = Math.atan2(dy, dx);

            const moveX = Math.cos(angle) * dist;
            const moveY = Math.sin(angle) * dist;

            stick.style.transform = `translate(${moveX}px, ${moveY}px)`;
            this.inputVector.set(moveX / maxDist, moveY / maxDist);
        }, { passive: true });

        window.addEventListener('touchend', () => {
            if (!active) return;
            active = false;
            stick.style.transform = `translate(0px, 0px)`;
            this.inputVector.set(0, 0);
        });
    }

    update() {
        let x = 0;
        let y = 0;

        if (this.keys['w'] || this.keys['ArrowUp']) y -= 1;
        if (this.keys['s'] || this.keys['ArrowDown']) y += 1;
        if (this.keys['a'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['d'] || this.keys['ArrowRight']) x += 1;

        if (x !== 0 || y !== 0) {
            this.inputVector.set(x, y).normalize();
        } else if (this.inputVector.length() === 0) {
            // Keep touch input if active, else zero
        }
    }
}
