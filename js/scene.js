import * as THREE from 'three';
import { CONFIG } from './config.js';

export class GameScene {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Daylight sky
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.setupEnvironment();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
        ambientLight.position.set(0, 200, 0);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        dirLight.position.set(100, 150, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 150;
        dirLight.shadow.camera.bottom = -150;
        dirLight.shadow.camera.left = -150;
        dirLight.shadow.camera.right = 150;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    setupEnvironment() {
        // Ground Grid / District Plane
        const groundGeo = new THREE.PlaneGeometry(CONFIG.WORLD.GROUND_SIZE, CONFIG.WORLD.GROUND_SIZE);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a324b,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid helper representing Abuja district layout blocks
        const grid = new THREE.GridHelper(CONFIG.WORLD.GROUND_SIZE, 50, 0x008751, 0x334155);
        grid.position.y = 0.01;
        this.scene.add(grid);

        // Add placeholder Abuja skyline reference blocks (Central Business District blocks)
        const boxGeo = new THREE.BoxGeometry(15, 40, 15);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
        
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const building = new THREE.Mesh(boxGeo, boxMat);
            building.position.set(i * 35, 20, -50);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
