export class Controls {
    constructor() {
        this.inputVector = { x: 0, z: 0 };
        this.cameraAngle = 0; 
        this.pointerStartX = 0;
        this.isDraggingCamera = false;
        this.lookPointerId = null;

        this.setupJoystick();
        this.setupPointerLook();
    }

    setupJoystick() {
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        if (!base || !stick) return;

        let activePointerId = null;

        const handleMove = (clientX, clientY) => {
            const rect = base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let dx = clientX - centerX;
            let dy = clientY - centerY;
            const maxRadius = rect.width / 2;

            const distance = Math.hypot(dx, dy);
            if (distance > maxRadius) {
                dx = (dx / distance) * maxRadius;
                dy = (dy / distance) * maxRadius;
            }

            stick.style.transform = `translate(${dx}px, ${dy}px)`;

            this.inputVector.x = dx / maxRadius;
            this.inputVector.z = dy / maxRadius;
        };

        base.addEventListener('pointerdown', (e) => {
            activePointerId = e.pointerId;
            handleMove(e.clientX, e.clientY);
            base.setPointerCapture(e.pointerId);
        });

        base.addEventListener('pointermove', (e) => {
            if (e.pointerId === activePointerId) {
                handleMove(e.clientX, e.clientY);
            }
        });

        const reset = (e) => {
            if (e.pointerId === activePointerId) {
                activePointerId = null;
                stick.style.transform = 'translate(0px, 0px)';
                this.inputVector.x = 0;
                this.inputVector.z = 0;
            }
        };

        base.addEventListener('pointerup', reset);
        base.addEventListener('pointercancel', reset);
    }

    setupPointerLook() {
        // Listen globally for drags anywhere on the screen outside the joystick & buttons
        window.addEventListener('pointerdown', (e) => {
            const joystickZone = document.getElementById('joystick-zone');
            if (joystickZone && joystickZone.contains(e.target)) return;
            if (e.target.tagName === 'BUTTON') return;

            if (this.lookPointerId === null) {
                this.lookPointerId = e.pointerId;
                this.pointerStartX = e.clientX;
                this.isDraggingCamera = true;
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDraggingCamera || e.pointerId !== this.lookPointerId) return;

            const deltaX = e.clientX - this.pointerStartX;
            this.cameraAngle -= deltaX * 0.008; // Sensitivity multiplier
            this.pointerStartX = e.clientX;
        });

        const endLook = (e) => {
            if (e.pointerId === this.lookPointerId) {
                this.lookPointerId = null;
                this.isDraggingCamera = false;
            }
        };

        window.addEventListener('pointerup', endLook);
        window.addEventListener('pointercancel', endLook);
    }

    update() {
        // Loop hook placeholder
    }
}
