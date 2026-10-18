import { GameScene } from './scene.js';
import { Player } from './player.js';
import { Controls } from './controls.js';
import { EconomySystem } from './economy.js';
import { HUD } from './hud.js';

export class Game {
    constructor() {
        const container = document.getElementById('game-container');
        this.sceneManager = new GameScene(container);
        this.economy = new EconomySystem();
        this.hud = new HUD(this.economy);
        this.player = new Player(this.sceneManager.scene);
        this.controls = new Controls();

        this.initLoading();
    }

    initLoading() {
        const progressFill = document.getElementById('progress-fill');
        const startBtn = document.getElementById('btn-start');
        const loadingScreen = document.getElementById('loading-screen');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            if (progressFill) progressFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                if (startBtn) {
                    startBtn.textContent = "Enter Abuja (Play)";
                    startBtn.disabled = false;
                    startBtn.addEventListener('click', () => {
                        loadingScreen.style.opacity = '0';
                        setTimeout(() => loadingScreen.remove(), 500);
                        this.startLoop();
                    }, { once: true });
                }
            }
        }, 150);
    }

    startLoop() {
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);

            this.controls.update();
            this.player.update(this.controls.inputVector, 0);

            // Smooth camera follow
            const targetCamPos = new THREE.Vector3(
                this.player.position.x,
                this.player.position.y + 4,
                this.player.position.z + 8
            );
            this.sceneManager.camera.position.lerp(targetCamPos, 0.1);
            this.sceneManager.camera.lookAt(
                this.player.position.x,
                this.player.position.y + 1.5,
                this.player.position.z
            );

            this.sceneManager.render();
        };

        animate();
    }
}
