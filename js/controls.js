export class Controls {
    constructor() {
        this.inputVector = { x: 0, z: 0 };
        this.cameraAngle = 0; 
        
        this.setupJoystick();
        this.setupTouchSwipe();
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
            e.stopPropagation();
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            handleMove(touch.clientX, touch.clientY);
        }, { passive: false });

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

    setupTouchSwipe() {
        let lastX = 0;
        let isSwiping = false;

        document.addEventListener('touchstart', (e) => {
            // Ignore touches on UI buttons or joystick
            if (e.target.closest('#joystick-zone') || e.target.closest('button') || e.target.closest('#atm-modal')) {
                return;
            }
            if (e.touches.length > 0) {
                lastX = e.touches[0].clientX;
                isSwiping = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isSwiping || e.touches.length === 0) return;
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - lastX;
            
            this.cameraAngle -= deltaX * 0.008; // Orbit angle sensitivity
            lastX = currentX;
        }, { passive: true });

        const endSwipe = () => {
            isSwiping = false;
        };

        document.addEventListener('touchend', endSwipe, { passive: true });
        document.addEventListener('touchcancel', endSwipe, { passive: true });
    }

    update() {
        // Keeps state ready for game loop
    }
                }
