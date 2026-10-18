export class Controls {
    constructor() {
        this.inputVector = { x: 0, z: 0 };
        this.cameraAngle = 0; // Horizontal rotation angle in radians
        this.touchStartX = 0;
        this.isDraggingCamera = false;

        this.setupJoystick();
        this.setupTouchLook();
    }

    setupJoystick() {
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        if (!base || !stick) return;

        let touchId = null;

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

        base.addEventListener('touchstart', (e) => {
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            handleMove(touch.clientX, touch.clientY);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    handleMove(touch.clientX, touch.clientY);
                }
            }
        }, { passive: true });

        const reset = (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    touchId = null;
                    stick.style.transform = 'translate(0px, 0px)';
                    this.inputVector.x = 0;
                    this.inputVector.z = 0;
                }
            }
        };

        window.addEventListener('touchend', reset, { passive: true });
        window.addEventListener('touchcancel', reset, { passive: true });
    }

    setupTouchLook() {
        let touchId = null;

        window.addEventListener('touchstart', (e) => {
            const joystickZone = document.getElementById('joystick-zone');
            for (let touch of e.changedTouches) {
                // Ignore touches inside the joystick area or HUD buttons
                if (joystickZone && joystickZone.contains(e.target)) continue;
                if (e.target.tagName === 'BUTTON') continue;

                if (touchId === null) {
                    touchId = touch.identifier;
                    this.touchStartX = touch.clientX;
                    this.isDraggingCamera = true;
                }
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!this.isDraggingCamera) return;

            for (let touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    const deltaX = touch.clientX - this.touchStartX;
                    this.cameraAngle -= deltaX * 0.005; // Adjust sensitivity
                    this.touchStartX = touch.clientX;
                }
            }
        }, { passive: true });

        const endTouch = (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    touchId = null;
                    this.isDraggingCamera = false;
                }
            }
        };

        window.addEventListener('touchend', endTouch, { passive: true });
        window.addEventListener('touchcancel', endTouch, { passive: true });
    }

    update() {
        // Keeps state ready for game loop
    }
}
