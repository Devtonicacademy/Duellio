/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  LudoTokenState,
  PlayerColor,
  getTokenCell,
  SAFE_COORDS,
  PATH_COORDINATES
} from '../utils/ludoEngine';

interface Ludo3DCanvasProps {
  tokens: LudoTokenState[];
  activePlayer: PlayerColor;
  diceRollValue: number;
  secondDiceValue: number;
  isRolling: boolean;
  isUserTurn: boolean;
  playableTokenIds: string[];
  onSelectToken: (tokenId: string) => void;
  view3D: boolean;
}

export const Ludo3DCanvas: React.FC<Ludo3DCanvasProps> = ({
  tokens,
  activePlayer,
  diceRollValue,
  secondDiceValue,
  isRolling,
  isUserTurn,
  playableTokenIds,
  onSelectToken,
  view3D
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pawnsMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const dice1Ref = useRef<THREE.Group | null>(null);
  const dice2Ref = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Convert 15x15 board cell [row, col] to 3D scene world coordinates [x, y, z]
  const cellToWorld = (row: number, col: number, heightOffset = 0.35): [number, number, number] => {
    const tileSize = 0.62;
    const boardOffset = (15 * tileSize) / 2 - tileSize / 2;
    const x = col * tileSize - boardOffset;
    const z = row * tileSize - boardOffset;
    return [x, heightOffset, z];
  };

  // Convert token state to 3D position
  const getTokenWorldPos = (token: LudoTokenState): [number, number, number] => {
    const [row, col] = getTokenCell(token);
    return cellToWorld(row, col, 0.4);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180d07);
    sceneRef.current = scene;

    // 2. CAMERA SETUP (Fixed Isometric Perspective)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    if (view3D) {
      camera.position.set(0, 16, 14);
      camera.lookAt(0, 0, 0.5);
    } else {
      camera.position.set(0, 20, 0.01);
      camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. PHYSICALLY BASED LIGHTING (PBR)
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.9);
    scene.add(ambientLight);

    // Warm Directional Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaee, 2.5);
    keyLight.position.set(12, 22, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0x88ccff, 1.2);
    fillLight.position.set(-12, 15, -10);
    scene.add(fillLight);

    // Rim Light
    const rimLight = new THREE.DirectionalLight(0xffaa44, 1.8);
    rimLight.position.set(0, 10, -15);
    scene.add(rimLight);

    // 5. DARK WALNUT WOODEN TABLE FLOOR
    const tableGeo = new THREE.PlaneGeometry(40, 40);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1c120c,
      roughness: 0.45,
      metalness: 0.1
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = -0.3;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // 6. ELEVATED BEVELED MATTE BLACK BOARD SLAB
    const boardWidth = 15 * 0.62 + 0.5;
    const boardGeo = new THREE.BoxGeometry(boardWidth, 0.5, boardWidth);
    const boardMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f141e,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.y = 0;
    boardMesh.receiveShadow = true;
    boardMesh.castShadow = true;
    scene.add(boardMesh);

    // 7. BUILD 15x15 GRID TILES & RECESSED HOME BASE TRAYS
    const tileSize = 0.62;
    const boardOffset = (15 * tileSize) / 2 - tileSize / 2;

    const tileBaseGeo = new THREE.BoxGeometry(tileSize * 0.94, 0.08, tileSize * 0.94);
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.25 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xe52521, roughness: 0.2 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1b4eab, roughness: 0.2 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x009a44, roughness: 0.2 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.2 });

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const x = c * tileSize - boardOffset;
        const z = r * tileSize - boardOffset;

        // Skip center 3x3 box (rendered as center home pyramid)
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        let mat = creamMat;
        let yPos = 0.28;

        // Base Yards
        if (r <= 5 && c <= 5) mat = redMat;
        else if (r <= 5 && c >= 9) mat = blueMat;
        else if (r >= 9 && c >= 9) mat = greenMat;
        else if (r >= 9 && c <= 5) mat = yellowMat;

        // Home Runways
        else if (r === 7 && c >= 1 && c <= 5) { mat = redMat; yPos = 0.31; }
        else if (c === 7 && r >= 1 && r <= 5) { mat = blueMat; yPos = 0.31; }
        else if (r === 7 && c >= 9 && c <= 13) { mat = greenMat; yPos = 0.31; }
        else if (c === 7 && r >= 9 && r <= 13) { mat = yellowMat; yPos = 0.31; }

        const tileMesh = new THREE.Mesh(tileBaseGeo, mat);
        tileMesh.position.set(x, yPos, z);
        tileMesh.receiveShadow = true;
        scene.add(tileMesh);
      }
    }

    // 8. CENTER HOME TRIANGLES PYRAMID
    const centerSize = tileSize * 3;
    const centerGeo = new THREE.BoxGeometry(centerSize, 0.1, centerSize);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.position.set(0, 0.28, 0);
    centerMesh.receiveShadow = true;
    scene.add(centerMesh);

    // 9. CREATE TRANSLUCENT ACRYLIC GLASS DICE
    const createDiceMesh = (x: number, z: number): THREE.Group => {
      const group = new THREE.Group();
      const diceGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
      const diceMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.92,
        roughness: 0.1,
        metalness: 0.05,
        transmission: 0.85,
        thickness: 0.6,
        clearcoat: 1.0
      });
      const diceBody = new THREE.Mesh(diceGeo, diceMat);
      diceBody.castShadow = true;
      diceBody.receiveShadow = true;
      group.add(diceBody);

      // Pips
      const pipGeo = new THREE.SphereGeometry(0.07, 12, 12);
      const pipMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

      // Top face (1 pip)
      const p1 = new THREE.Mesh(pipGeo, pipMat);
      p1.position.set(0, 0.38, 0);
      group.add(p1);

      group.position.set(x, 0.7, z);
      return group;
    };

    const d1 = createDiceMesh(1.4, 1.4);
    const d2 = createDiceMesh(2.2, 0.8);
    scene.add(d1);
    scene.add(d2);
    dice1Ref.current = d1;
    dice2Ref.current = d2;

  const isRollingRef = useRef(isRolling);

  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  // 10. ANIMATION LOOP
  useEffect(() => {
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isRollingRef.current) {
        if (dice1Ref.current) {
          dice1Ref.current.rotation.x += 0.25;
          dice1Ref.current.rotation.y += 0.35;
          dice1Ref.current.rotation.z += 0.15;
          dice1Ref.current.position.y = 0.7 + Math.abs(Math.sin(Date.now() * 0.02)) * 0.8;
        }
        if (dice2Ref.current) {
          dice2Ref.current.rotation.x += 0.3;
          dice2Ref.current.rotation.y += 0.2;
          dice2Ref.current.rotation.z += 0.25;
          dice2Ref.current.position.y = 0.7 + Math.abs(Math.cos(Date.now() * 0.02)) * 0.8;
        }
      } else {
        if (dice1Ref.current) {
          dice1Ref.current.position.y = 0.7;
          dice1Ref.current.rotation.set(0, 0, 0);
        }
        if (dice2Ref.current) {
          dice2Ref.current.position.y = 0.7;
          dice2Ref.current.rotation.set(0, 0, 0);
        }
      }

      // Smoothly update camera perspective
      if (cameraRef.current) {
        const targetY = view3D ? 16 : 20;
        const targetZ = view3D ? 14 : 0.01;
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
        cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.05;
        cameraRef.current.lookAt(0, 0, view3D ? 0.5 : 0);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [view3D]);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [view3D]);

  // UPDATE OR SPAWN 16 HIGH-GLOSS HALMA 3D PAWNS
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const existingMap = pawnsMapRef.current;

    const createPawnGroup = (color: PlayerColor): THREE.Group => {
      const group = new THREE.Group();

      const colorHexMap: Record<PlayerColor, number> = {
        red: 0xee2222,
        blue: 0x1b55cc,
        green: 0x00aa44,
        gold: 0xffcc00
      };

      const colorHex = colorHexMap[color];

      const pawnMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.9
      });

      // 1. Pawn Base Skirt
      const baseGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.22, 24);
      const baseMesh = new THREE.Mesh(baseGeo, pawnMat);
      baseMesh.position.y = 0.11;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // 2. Pawn Neck Ring
      const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.1, 24);
      const neckMesh = new THREE.Mesh(neckGeo, pawnMat);
      neckMesh.position.y = 0.25;
      neckMesh.castShadow = true;
      group.add(neckMesh);

      // 3. Pawn Sphere Head
      const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
      const headMesh = new THREE.Mesh(headGeo, pawnMat);
      headMesh.position.y = 0.4;
      headMesh.castShadow = true;
      group.add(headMesh);

      return group;
    };

    tokens.forEach(token => {
      const [tx, ty, tz] = getTokenWorldPos(token);
      let pawnGroup = existingMap.get(token.id);

      if (!pawnGroup) {
        pawnGroup = createPawnGroup(token.color);
        pawnGroup.name = token.id;
        scene.add(pawnGroup);
        existingMap.set(token.id, pawnGroup);
      }

      // Smooth Position Interpolation
      pawnGroup.position.set(tx, ty, tz);

      // Highlight Playable Tokens
      const isPlayable = playableTokenIds.includes(token.id);
      if (isPlayable) {
        pawnGroup.scale.set(1.25, 1.25, 1.25);
      } else {
        pawnGroup.scale.set(1.0, 1.0, 1.0);
      }
    });

  }, [tokens, playableTokenIds]);

  // RAYCASTING FOR DIRECT 3D PAWN CLICK DETECTION
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr.parent && curr.parent !== sceneRef.current) {
        if (pawnsMapRef.current.has(curr.name)) {
          const tokenId = curr.name;
          if (playableTokenIds.includes(tokenId)) {
            onSelectToken(tokenId);
          }
          return;
        }
        curr = curr.parent;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="w-full h-[380px] sm:h-[480px] relative cursor-pointer overflow-hidden rounded-3xl"
    />
  );
};
