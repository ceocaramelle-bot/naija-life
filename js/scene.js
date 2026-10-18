import * as THREE from 'three';

export class GameScene {
    constructor(container) {
        this.container = container || document.getElementById('game-container');
        
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x38bdf8); // Sky blue Abuja daylight
        this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.015);

        // Camera Setup
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 6, 12);

        // WebGL Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear container and append canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Ensure canvas styles fill container perfectly
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';

        // Lighting
        this.setupLighting();

        // Handle Window Resizing
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient Light for general brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // Directional Sun Light
        const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
        sunLight.position.set(50, 80, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        const d = 40;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        this.scene.add(sunLight);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
