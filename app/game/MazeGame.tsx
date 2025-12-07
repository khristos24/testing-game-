"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

const maze = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

export default function MazeGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(1.5, 1, 1.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.55);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const floorGeometry = new THREE.PlaneGeometry(
      maze[0].length,
      maze.length
    );
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(
      maze[0].length / 2 - 0.5,
      0,
      maze.length / 2 - 0.5
    );
    scene.add(floor);

    const wallGeometry = new THREE.BoxGeometry(1, 2, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x7a7a7a });
    const wallBoxes: THREE.Box3[] = [];

    for (let z = 0; z < maze.length; z++) {
      for (let x = 0; x < maze[z].length; x++) {
        if (maze[z][x] === 1) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(x, 1, z);
          scene.add(wall);
          wall.updateMatrixWorld();
          const box = new THREE.Box3().setFromObject(wall);
          wallBoxes.push(box);
        }
      }
    }

    const moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const clock = new THREE.Clock();
    const playerBox = new THREE.Box3();
    const playerSize = 0.3;
    const playerHeight = 1.8;

    const checkCollision = (position: THREE.Vector3) => {
      playerBox.setFromCenterAndSize(
        new THREE.Vector3(position.x, playerHeight / 2, position.z),
        new THREE.Vector3(playerSize * 2, playerHeight, playerSize * 2)
      );
      return wallBoxes.some((box) => playerBox.intersectsBox(box));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveState.forward = true;
          break;
        case "KeyS":
          moveState.backward = true;
          break;
        case "KeyA":
          moveState.left = true;
          break;
        case "KeyD":
          moveState.right = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveState.forward = false;
          break;
        case "KeyS":
          moveState.backward = false;
          break;
        case "KeyA":
          moveState.left = false;
          break;
        case "KeyD":
          moveState.right = false;
          break;
      }
    };

    const onClick = () => controls.lock();

    const onLock = () => {
      lockedRef.current = true;
      setLocked(true);
    };

    const onUnlock = () => {
      lockedRef.current = false;
      setLocked(false);
      velocity.set(0, 0, 0);
    };

    controls.addEventListener("lock", onLock);
    controls.addEventListener("unlock", onUnlock);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    renderer.domElement.addEventListener("click", onClick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    const animate = () => {
      const delta = clock.getDelta();

      velocity.x -= velocity.x * 10 * delta;
      velocity.z -= velocity.z * 10 * delta;

      direction.z = Number(moveState.forward) - Number(moveState.backward);
      direction.x = Number(moveState.right) - Number(moveState.left);
      if (direction.lengthSq() > 0) direction.normalize();

      if (moveState.forward || moveState.backward) {
        velocity.z -= direction.z * 30 * delta;
      }
      if (moveState.left || moveState.right) {
        velocity.x -= direction.x * 30 * delta;
      }

      if (lockedRef.current) {
        const forward = new THREE.Vector3();
        controls.getDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const deltaX = -velocity.x * delta;
        const deltaZ = -velocity.z * delta;

        const position = controls.getObject().position;

        if (deltaX !== 0) {
          const stepX = right.clone().multiplyScalar(deltaX);
          const nextX = position.clone().add(stepX);
          if (!checkCollision(nextX)) {
            position.add(stepX);
          } else {
            velocity.x = 0;
          }
        }

        if (deltaZ !== 0) {
          const stepZ = forward.clone().multiplyScalar(deltaZ);
          const nextZ = position.clone().add(stepZ);
          if (!checkCollision(nextZ)) {
            position.add(stepZ);
          } else {
            velocity.z = 0;
          }
        }
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("click", onClick);
      controls.removeEventListener("lock", onLock);
      controls.removeEventListener("unlock", onUnlock);
      controls.dispose();
      wallGeometry.dispose();
      wallMaterial.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", position: "relative", cursor: "crosshair" }}
    >
      {!locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.45)",
            color: "#ffffff",
            fontFamily: "sans-serif",
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "0.05em",
          }}
        >
          Click to start
        </div>
      )}
    </div>
  );
}
