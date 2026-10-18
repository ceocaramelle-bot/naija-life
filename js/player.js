import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.speed = 0.12;
        this.isMoving = false;

        this.createMesh();
    }

    createMesh() {
        // Placeholder 3D Character Mesh (Capsule / Box avatar with direction indicator)
        const group = new THREE.Group();

        // Body
        const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.2, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x008751, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.1;
        body.castShadow = true;
        group.add(body);

        // Head / Cap marker
        const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b1, roughness: 0.6 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.0;
        head.castShadow = true;
        group.add(head);

        this.mesh = group;
        this.scene.add(this.mesh);
    }

    update(inputVector, cameraAngle) {
        if (inputVector.length() > 0.01) {
            this.isMoving = true;
            // Calculate movement relative to camera angle
            const angle = Math.atan2(inputVector.x, inputVector.y) + cameraAngle;
            
            this.position.x += Math.sin(angle) * this.speed;
            this.position.z += Math.cos(angle) * this.speed;

            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = angle;
        } else {
            this.isMoving = false;
        }
    }
}
