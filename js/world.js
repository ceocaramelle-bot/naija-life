import * as THREE from 'three';

export class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.interactables = [];
        this.buildDistrict();
    }

    buildDistrict() {
        // --- 1. Main Asphalt Roads ---
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
        
        // North-South Main Ave
        const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 300), roadMaterial);
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.y = 0.01;
        mainRoad.receiveShadow = true;
        this.scene.add(mainRoad);

        // East-West Cross Street
        const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(300, 16), roadMaterial);
        crossRoad.rotation.x = -Math.PI / 2;
        crossRoad.position.y = 0.01;
        crossRoad.receiveShadow = true;
        this.scene.add(crossRoad);

        // Yellow Road Markings
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 300), lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.scene.add(centerLine);

        // --- 2. Procedural Buildings (Asokoro / Maitama Style) ---
        const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
        const concreteMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
        const brickMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });

        const materials = [glassMaterial, concreteMaterial, brickMaterial];

        // Grid positions for building blocks
        const blocks = [
            { x: -35, z: -35, w: 25, h: 40, d: 25 },
            { x: 35, z: -35, w: 30, h: 55, d: 25 },
            { x: -35, z: 35, w: 25, h: 30, d: 25 },
            { x: 35, z: 35, w: 35, h: 45, d: 30 },
            { x: -70, z: -35, w: 20, h: 25, d: 20 },
            { x: 70, z: 35, w: 25, h: 35, d: 20 },
        ];

        blocks.forEach((b, idx) => {
            const mat = materials[idx % materials.length];
            const geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
            const building = new THREE.Mesh(geometry, mat);
            
            building.position.set(b.x, b.h / 2, b.z);
            building.castShadow = true;
            building.receiveShadow = true;
            
            this.scene.add(building);
            this.buildings.push(building);
        });

        // --- 3. First Interactive Spot: Zenith ATM Kiosk ---
        this.createATMSpot(12, -15);
    }

    createATMSpot(x, z) {
        const kioskGroup = new THREE.Group();
        
        // ATM Structure
        const bodyGeo = new THREE.BoxGeometry(3, 4, 3);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x008751 }); // Nigerian Green
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 2;
        kioskGroup.add(body);

        // Screen Glowing Area
        const screenGeo = new THREE.PlaneGeometry(1.5, 1);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 2.3, 1.51);
        kioskGroup.add(screen);

        kioskGroup.position.set(x, 0, z);
        this.scene.add(kioskGroup);

        this.interactables.push({
            name: "First Bank ATM",
            type: "atm",
            position: kioskGroup.position,
            radius: 4
        });
    }
}
