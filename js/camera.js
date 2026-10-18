class ThirdPersonCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;
    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
  }

  update() {
    if (!this.target) return;

    const idealOffset = new THREE.Vector3(0, 3, -6);
    idealOffset.applyQuaternion(this.target.quaternion);
    idealOffset.add(this.target.position);

    const idealLookAt = this.target.position.clone();
    idealLookAt.y += 1.5;

    this.currentPosition.lerp(idealOffset, 0.15);
    this.currentLookAt.lerp(idealLookAt, 0.2);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
