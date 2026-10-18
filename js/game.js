import * as THREE from 'three';
import { GameScene } from './scene.js';
import { Player } from './player.js';
import { Controls } from './controls.js';
import { EconomySystem } from './economy.js';
import { HUD } from './hud.js';
import { Minimap } from './minimap.js';
import { WorldGenerator } from './world.js';
import { InteractionSystem } from './interaction.js';

export class Game {
    constructor() {
        const container = document.getElementById('game-container');
        this.sceneManager = new GameScene(container);
        this.economy = new EconomySystem();
        this.hud = new HUD(this.economy);
        this.world = new WorldGenerator(this.sceneManager.scene);
        this.player = new Player(this.sceneManager.scene);
        this.controls = new Controls();
        this.minimap = new Minimap(this.player);
        this.interaction = new InteractionSystem(this.player, this.world, this.economy, this.hud);

        this.initLoading();
    }

    initLoading() {
        const progressFill = document.getElementById('progress-fill');
        const startBtn = document.getElementById('btn-start');
        const loadingScreen = document.getElementById('loading-screen');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 35;
            if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                if (startBtn) {
                    startBtn.textContent = "Enter Abuja (Play)";
                    startBtn.disabled = false;
                    
                    // Direct event listener to hide loading screen and start game loop
                    startBtn.onclick = () => {
                        if (loadingScreen) {
                            loadingScreen.style.display = 'none';
                        }
                        this.startLoop();
                    };
                } else {
                    if (loadingScreen) loadingScreen.style.display = 'none';
                    this.startLoop();
                }
            }
        }, 80);
    }

    startLoop() {
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();

            this.controls.update();
            this.player.update(this.controls.inputVector, delta);
            this.interaction.update();

            // Camera Orbit & Follow Logic
            const camDistance = 12;
            const camHeight = 6;
            const angle = this.controls.cameraAngle;

            const targetCamPos = new THREE.Vector3(
                this.player.position.x + Math.sin(angle) * camDistance,
                this.player.position.y + camHeight,
                this.player.position.z + Math.cos(angle) * camDistance
            );

            this.sceneManager.camera.position.lerp(targetCamPos, 0.1);
            this.sceneManager.camera.lookAt(
                this.player.position.x,
                this.player.position.y + 1.5,
                this.player.position.z
            );

            this.minimap.update();
            this.sceneManager.render();
        };

        animate();
    }
}
