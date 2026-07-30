/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, ZoomIn, ZoomOut, Compass } from 'lucide-react';
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
  const isRollingRef = useRef<boolean>(isRolling);

  // 3D Camera Orbit & Pan State
  const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 3.4, radius: 21 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.3, 0.5));
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(21);
  const diceRollValueRef = useRef<number>(diceRollValue);
  const secondDiceValueRef = useRef<number>(secondDiceValue);

  // Sync props to mutable refs for animation loop
  useEffect(() => {
    isRollingRef.current = isRolling;
    diceRollValueRef.current = diceRollValue;
    secondDiceValueRef.current = secondDiceValue;
  }, [isRolling, diceRollValue, secondDiceValue]);

  const getDiceRotation = (val: number): [number, number, number] => {
    switch (val) {
      case 1: return [0, 0, 0];
      case 2: return [-Math.PI / 2, 0, 0];
      case 3: return [0, 0, -Math.PI / 2];
      case 4: return [0, 0, Math.PI / 2];
      case 5: return [Math.PI / 2, 0, 0];
      case 6: return [Math.PI, 0, 0];
      default: return [0, 0, 0];
    }
  };

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

  // Update 3D Camera Spherical Orbit & Pan Position
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;

    // Clamp vertical angle to prevent flipping under table or over top
    const clampedPhi = Math.max(0.12, Math.min(Math.PI / 2 - 0.04, phi));
    cameraAngleRef.current.phi = clampedPhi;

    const y = targetLookAtRef.current.y + radius * Math.cos(clampedPhi);
    const horizontalRadius = radius * Math.sin(clampedPhi);
    const x = targetLookAtRef.current.x + horizontalRadius * Math.sin(theta);
    const z = targetLookAtRef.current.z + horizontalRadius * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAtRef.current);
    setZoomLevel(Math.round(radius));
  };

  // Reset Camera View to Default Isometric Angle
  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: 0, phi: Math.PI / 3.4, radius: 21 };
    targetLookAtRef.current.set(0, 0.3, 0.5);
    updateCameraPosition();
  };

  // Top-Down Camera View
  const handleTopDownCamera = () => {
    cameraAngleRef.current = { theta: 0, phi: Math.PI / 2.02, radius: 19.5 };
    targetLookAtRef.current.set(0, 0.3, 0);
    updateCameraPosition();
  };

  // Zoom In / Zoom Out Increments
  const handleZoomIn = () => {
    cameraAngleRef.current.radius = Math.max(8.0, cameraAngleRef.current.radius - 3.0);
    updateCameraPosition();
  };

  const handleZoomOut = () => {
    cameraAngleRef.current.radius = Math.min(34.0, cameraAngleRef.current.radius + 3.0);
    updateCameraPosition();
  };

  // INITIALIZE THREE.JS SCENE, CAMERA, LIGHTING & ANIMATION LOOP
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180d07);
    sceneRef.current = scene;

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

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

        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        let mat = creamMat;
        let yPos = 0.28;

        if (r <= 5 && c <= 5) mat = redMat;
        else if (r <= 5 && c >= 9) mat = blueMat;
        else if (r >= 9 && c >= 9) mat = greenMat;
        else if (r >= 9 && c <= 5) mat = yellowMat;
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

    // 9. CREATE TRANSLUCENT ACRYLIC GLASS DICE WITH ALL 6 FACES
    const createSixSidedDiceMesh = (x: number, z: number): THREE.Group => {
      const group = new THREE.Group();
      const diceGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
      const diceMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.98,
        roughness: 0.08,
        metalness: 0.05,
        transmission: 0.45,
        thickness: 0.8,
        clearcoat: 1.0
      });
      const diceBody = new THREE.Mesh(diceGeo, diceMat);
      diceBody.castShadow = true;
      diceBody.receiveShadow = true;
      group.add(diceBody);

      const pipGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const pipMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

      const addPip = (px: number, py: number, pz: number) => {
        const pip = new THREE.Mesh(pipGeo, pipMat);
        pip.position.set(px, py, pz);
        group.add(pip);
      };

      const S = 0.38; // Face surface distance
      const O = 0.18; // Pip offset on face

      // Face 1 (+Y Top Face): 1 center pip
      addPip(0, S, 0);

      // Face 6 (-Y Bottom Face): 6 pips (2 rows of 3)
      addPip(-O, -S, -O); addPip(0, -S, -O); addPip(O, -S, -O);
      addPip(-O, -S, O);  addPip(0, -S, O);  addPip(O, -S, O);

      // Face 2 (+Z Front Face): 2 diagonal pips
      addPip(-O, O, S);   addPip(O, -O, S);

      // Face 5 (-Z Back Face): 5 pips (4 corners + center)
      addPip(-O, O, -S);  addPip(O, O, -S);  addPip(0, 0, -S);
      addPip(-O, -O, -S); addPip(O, -O, -S);

      // Face 3 (-X Left Face): 3 diagonal pips
      addPip(-S, O, -O);  addPip(-S, 0, 0);  addPip(-S, -O, O);

      // Face 4 (+X Right Face): 4 corner pips
      addPip(S, O, -O);   addPip(S, O, O);
      addPip(S, -O, -O);  addPip(S, -O, O);

      group.position.set(x, 0.7, z);
      return group;
    };

    const d1 = createSixSidedDiceMesh(1.4, 1.4);
    const d2 = createSixSidedDiceMesh(2.2, 0.8);
    scene.add(d1);
    scene.add(d2);
    dice1Ref.current = d1;
    dice2Ref.current = d2;

    // 10. ANIMATION LOOP
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
          const [rx, ry, rz] = getDiceRotation(diceRollValueRef.current);
          dice1Ref.current.rotation.set(rx, ry, rz);
        }
        if (dice2Ref.current) {
          dice2Ref.current.position.y = 0.7;
          const [rx, ry, rz] = getDiceRotation(secondDiceValueRef.current);
          dice2Ref.current.rotation.set(rx, ry, rz);
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // 11. WHEEL (ZOOM) & EVENT LISTENERS
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius += e.deltaY * 0.012;
      cameraAngleRef.current.radius = Math.max(8.0, Math.min(34.0, cameraAngleRef.current.radius));
      updateCameraPosition();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('wheel', handleWheel, { passive: false });

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
      domElement.removeEventListener('wheel', handleWheel);
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

      const baseGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.22, 24);
      const baseMesh = new THREE.Mesh(baseGeo, pawnMat);
      baseMesh.position.y = 0.11;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.1, 24);
      const neckMesh = new THREE.Mesh(neckGeo, pawnMat);
      neckMesh.position.y = 0.25;
      neckMesh.castShadow = true;
      group.add(neckMesh);

      const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
      const headMesh = new THREE.Mesh(headGeo, pawnMat);
      headMesh.position.y = 0.4;
      headMesh.castShadow = true;
      group.add(headMesh);

      // Invisible enlarged touch target for ultra-responsive 3D tapping
      const hitGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.7, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.y = 0.35;
      group.add(hitMesh);

      return group;
    };

    tokens.forEach(token => {
      const [tx, ty, tz] = getTokenWorldPos(token);
      let pawnGroup = existingMap.get(token.id);

      if (!pawnGroup) {
        pawnGroup = createPawnGroup(token.color);
        pawnGroup.name = token.id;
        pawnGroup.children.forEach(child => {
          child.name = token.id;
        });
        scene.add(pawnGroup);
        existingMap.set(token.id, pawnGroup);
      }

      pawnGroup.position.set(tx, ty, tz);

      const isPlayable = playableTokenIds.includes(token.id);
      if (isPlayable) {
        pawnGroup.scale.set(1.3, 1.3, 1.3);
      } else {
        pawnGroup.scale.set(1.0, 1.0, 1.0);
      }
    });

  }, [tokens, playableTokenIds]);

  // MOUSE & TOUCH POINTER DRAG (ORBIT / PAN / ZOOM) & TAP SELECTION HANDLERS
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 2) {
      isPanningRef.current = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    const totalDist = Math.hypot(
      e.clientX - dragStartPosRef.current.x,
      e.clientY - dragStartPosRef.current.y
    );

    if (totalDist > 5) {
      isDraggingRef.current = true;
    }

    if (e.buttons === 1 && !isPanningRef.current) {
      // Left-Click Drag / Single-Touch Drag -> Orbit Rotate
      cameraAngleRef.current.theta -= deltaX * 0.007;
      cameraAngleRef.current.phi -= deltaY * 0.007;
      updateCameraPosition();
    } else if (e.buttons === 2 || isPanningRef.current) {
      // Right-Click Drag -> Pan Target
      const panFactor = cameraAngleRef.current.radius * 0.0008;
      targetLookAtRef.current.x -= deltaX * panFactor;
      targetLookAtRef.current.z += deltaY * panFactor;
      updateCameraPosition();
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = false;

    // If pointer moved less than 5px, execute pawn tap selection!
    if (!isDraggingRef.current) {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== sceneRef.current) {
          if (curr.name && pawnsMapRef.current.has(curr.name)) {
            const tokenId = curr.name;
            onSelectToken(tokenId);
            return;
          }
          curr = curr.parent;
        }
      }
    }
  };

  // TOUCH PINCH-TO-ZOOM HANDLERS
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (touchStartDistRef.current !== null) {
        const deltaDist = dist - touchStartDistRef.current;
        cameraAngleRef.current.radius -= deltaDist * 0.04;
        cameraAngleRef.current.radius = Math.max(8.0, Math.min(34.0, cameraAngleRef.current.radius));
        updateCameraPosition();
      }

      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[480px] overflow-hidden rounded-3xl group">
      {/* 3D WEBGL CONTAINER */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* FLOATING 3D CAMERA CONTROL TOOLBAR */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 p-1.5 bg-[#180e08]/90 backdrop-blur-md rounded-xl border border-amber-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-1.5 hover:bg-amber-950/80 text-amber-200/90 hover:text-white rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-1.5 hover:bg-amber-950/80 text-amber-200/90 hover:text-white rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-amber-500/20 my-auto" />

        <button
          onClick={handleResetCamera}
          title="Reset Camera Angle"
          className="p-1.5 hover:bg-amber-950/80 text-amber-200/90 hover:text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleTopDownCamera}
          title="Top-Down View"
          className="p-1.5 hover:bg-amber-950/80 text-amber-200/90 hover:text-white rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* FLOATING GESTURE HINT BADGE */}
      <div className="absolute bottom-3 left-3 z-30 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="px-2.5 py-1 bg-[#160d07]/90 backdrop-blur-md rounded-lg border border-amber-500/20 flex items-center gap-1.5 text-[9px] font-mono text-amber-300/90 shadow-lg">
          <Compass className="w-3 h-3 text-amber-400 animate-spin-slow" />
          <span>DRAG TO ORBIT • SCROLL/PINCH TO ZOOM • 2-FINGER PAN</span>
        </div>
      </div>
    </div>
  );
};
