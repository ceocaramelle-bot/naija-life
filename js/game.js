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
            progress += 25;
            if (progressFill) progressFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                if (startBtn) {
                    startBtn.textContent = "Enter Abuja (Play)";
                    startBtn.disabled = false;
                    startBtn.addEventListener('click', () => {
                        if (loadingScreen) {
                            loadingScreen.style.opacity = '0';
                            setTimeout(() => loadingScreen.style.display = 'none', 500);
                        }
                        this.startLoop();
                    }, { once: true });
                } else {
                    this.startLoop();
                }
            }
        }, 100);
    }

    startLoop() {
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();

            this.controls.update();
            this.player.update(this.controls.inputVector, delta);
            this.interaction.update();

            // Camera Orbit Logic based on swipe angle
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
