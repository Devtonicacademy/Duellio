/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Camera, Move3d } from 'lucide-react';

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type Color = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: Color;
}

type BoardGrid = Array<Array<ChessPiece | null>>;

interface Chess3DSceneProps {
  board: BoardGrid;
  selectedSquare: [number, number] | null;
  validDestinations: Array<[number, number]>;
  activeColor: Color;
  myColor?: Color;
  onTileClick: (row: number, col: number) => void;
}

// Global cached geometry factory for smooth performance and zero memory leaks
const geometryCache: Record<string, THREE.BufferGeometry> = {};

function getPieceGeometry(type: PieceType): THREE.BufferGeometry {
  if (geometryCache[type]) {
    return geometryCache[type];
  }

  let geo: THREE.BufferGeometry;
  const RADIAL_SEGMENTS = 64; // Ultra smooth high-res 3D lathe curves

  if (type === 'p') { // Pawn - Classic Staunton Proportion
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.42, 0.04),
      new THREE.Vector2(0.36, 0.07),
      new THREE.Vector2(0.38, 0.10),
      new THREE.Vector2(0.32, 0.14),
      new THREE.Vector2(0.34, 0.18),
      new THREE.Vector2(0.24, 0.22),
      new THREE.Vector2(0.14, 0.42),
      new THREE.Vector2(0.22, 0.46),
      new THREE.Vector2(0.14, 0.50),
      new THREE.Vector2(0.18, 0.60),
      new THREE.Vector2(0.11, 0.64),
      new THREE.Vector2(0, 0.64)
    ];
    const lathe = new THREE.LatheGeometry(points, RADIAL_SEGMENTS);
    // Spherical head
    const head = new THREE.SphereGeometry(0.18, 32, 32);
    head.translate(0, 0.70, 0);
    geo = mergeGeometries([lathe, head]);
  } 
  else if (type === 'r') { // Rook / Castle - Staunton Parapet
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.42, 0.04),
      new THREE.Vector2(0.36, 0.07),
      new THREE.Vector2(0.38, 0.10),
      new THREE.Vector2(0.32, 0.14),
      new THREE.Vector2(0.34, 0.18),
      new THREE.Vector2(0.28, 0.22),
      new THREE.Vector2(0.26, 0.56),
      new THREE.Vector2(0.35, 0.64),
      new THREE.Vector2(0.35, 0.84),
      new THREE.Vector2(0.26, 0.84),
      new THREE.Vector2(0.26, 0.72),
      new THREE.Vector2(0, 0.72)
    ];
    const lathe = new THREE.LatheGeometry(points, RADIAL_SEGMENTS);

    // Castellated parapet cutouts (4 Merlons)
    const merlonGeos: THREE.BufferGeometry[] = [lathe];
    const merlonCount = 4;
    for (let i = 0; i < merlonCount; i++) {
      const angle = (i * Math.PI * 2) / merlonCount;
      const m = new THREE.BoxGeometry(0.14, 0.14, 0.10);
      m.translate(0, 0.82, 0.30);
      m.rotateY(angle);
      merlonGeos.push(m);
    }
    geo = mergeGeometries(merlonGeos);
  }
  else if (type === 'n') { // Knight (Sculpted 3D Horse Head)
    // Base pedestal
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.42, 0.04),
      new THREE.Vector2(0.36, 0.07),
      new THREE.Vector2(0.38, 0.10),
      new THREE.Vector2(0.32, 0.14),
      new THREE.Vector2(0.34, 0.18),
      new THREE.Vector2(0.26, 0.24),
      new THREE.Vector2(0, 0.26)
    ];
    const baseGeo = new THREE.LatheGeometry(points, RADIAL_SEGMENTS);

    // 3D Extruded & Bevelled Horse Silhouette
    const shape = new THREE.Shape();
    shape.moveTo(-0.16, 0.24);
    shape.lineTo(-0.20, 0.48);
    shape.lineTo(-0.14, 0.70);
    shape.lineTo(-0.07, 0.90); // Mane crest
    shape.lineTo(0.09, 0.93);  // Ears
    shape.lineTo(0.17, 0.80);  // Forehead
    shape.lineTo(0.27, 0.64);  // Snout top
    shape.lineTo(0.20, 0.50);  // Muzzle chin
    shape.lineTo(0.10, 0.44);  // Jaw curve
    shape.lineTo(0.04, 0.24);  // Base join
    shape.closePath();

    const extrudeSettings = {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };
    const headGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    headGeo.center();
    headGeo.translate(0, 0.58, 0);

    // Eye sockets
    const leftEye = new THREE.SphereGeometry(0.035, 16, 16);
    leftEye.translate(0.13, 0.73, 0.12);
    const rightEye = new THREE.SphereGeometry(0.035, 16, 16);
    rightEye.translate(0.13, 0.73, -0.12);

    geo = mergeGeometries([baseGeo, headGeo, leftEye, rightEye]);
  }
  else if (type === 'b') { // Bishop - Miter Head & Finial
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.42, 0.04),
      new THREE.Vector2(0.36, 0.07),
      new THREE.Vector2(0.38, 0.10),
      new THREE.Vector2(0.32, 0.14),
      new THREE.Vector2(0.34, 0.18),
      new THREE.Vector2(0.25, 0.22),
      new THREE.Vector2(0.15, 0.50),
      new THREE.Vector2(0.24, 0.56),
      new THREE.Vector2(0.15, 0.60),
      new THREE.Vector2(0.26, 0.78),
      new THREE.Vector2(0.20, 0.92),
      new THREE.Vector2(0.06, 0.98),
      new THREE.Vector2(0, 0.98)
    ];
    const lathe = new THREE.LatheGeometry(points, RADIAL_SEGMENTS);

    // Top finial sphere
    const finial = new THREE.SphereGeometry(0.075, 24, 24);
    finial.translate(0, 1.02, 0);

    geo = mergeGeometries([lathe, finial]);
  }
  else if (type === 'q') { // Queen - Coronet Crown
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.44, 0.0),
      new THREE.Vector2(0.44, 0.04),
      new THREE.Vector2(0.38, 0.07),
      new THREE.Vector2(0.40, 0.10),
      new THREE.Vector2(0.34, 0.14),
      new THREE.Vector2(0.36, 0.18),
      new THREE.Vector2(0.27, 0.24),
      new THREE.Vector2(0.17, 0.62),
      new THREE.Vector2(0.26, 0.68),
      new THREE.Vector2(0.19, 0.72),
      new THREE.Vector2(0.32, 1.02),
      new THREE.Vector2(0.25, 1.02),
      new THREE.Vector2(0, 1.02)
    ];
    const lathe = new THREE.LatheGeometry(points, RADIAL_SEGMENTS);

    // Coronet points (8 mini spheres on crown rim)
    const coronetGeos: THREE.BufferGeometry[] = [lathe];
    const coronetCount = 8;
    for (let i = 0; i < coronetCount; i++) {
      const angle = (i * Math.PI * 2) / coronetCount;
      const ball = new THREE.SphereGeometry(0.045, 16, 16);
      ball.translate(0.30 * Math.cos(angle), 1.02, 0.30 * Math.sin(angle));
      coronetGeos.push(ball);
    }

    // Top center finial sphere
    const topBall = new THREE.SphereGeometry(0.085, 24, 24);
    topBall.translate(0, 1.10, 0);
    coronetGeos.push(topBall);

    geo = mergeGeometries(coronetGeos);
  }
  else { // King - Tall Crown & 3D Cross
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.46, 0.0),
      new THREE.Vector2(0.46, 0.04),
      new THREE.Vector2(0.40, 0.07),
      new THREE.Vector2(0.42, 0.10),
      new THREE.Vector2(0.35, 0.14),
      new THREE.Vector2(0.37, 0.18),
      new THREE.Vector2(0.28, 0.24),
      new THREE.Vector2(0.18, 0.62),
      new THREE.Vector2(0.28, 0.68),
      new THREE.Vector2(0.18, 0.74),
      new THREE.Vector2(0.34, 1.08),
      new THREE.Vector2(0.27, 1.14),
      new THREE.Vector2(0.12, 1.18),
      new THREE.Vector2(0, 1.18)
    ];
    const lathe = new THREE.LatheGeometry(points, RADIAL_SEGMENTS);

    // Cross on top of King's crown
    const vBar = new THREE.BoxGeometry(0.06, 0.24, 0.06);
    vBar.translate(0, 1.30, 0);
    const hBar = new THREE.BoxGeometry(0.18, 0.06, 0.06);
    hBar.translate(0, 1.32, 0);

    geo = mergeGeometries([lathe, vBar, hBar]);
  }

  geometryCache[type] = geo;
  return geo;
}

// Simple geometry merger helper
function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  let totalVertices = 0;
  let totalIndices = 0;

  geos.forEach(g => {
    totalVertices += g.attributes.position.count;
    if (g.index) totalIndices += g.index.count;
  });

  const posAttr = new Float32Array(totalVertices * 3);
  const normAttr = new Float32Array(totalVertices * 3);
  const indices = totalIndices > 0 ? new Uint32Array(totalIndices) : null;

  let vOffset = 0;
  let iOffset = 0;

  geos.forEach(g => {
    const pos = g.attributes.position;
    posAttr.set(pos.array, vOffset * 3);

    if (g.attributes.normal) {
      normAttr.set(g.attributes.normal.array, vOffset * 3);
    }

    if (g.index && indices) {
      for (let i = 0; i < g.index.count; i++) {
        indices[iOffset + i] = g.index.array[i] + vOffset;
      }
      iOffset += g.index.count;
    }

    vOffset += pos.count;
  });

  merged.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normAttr, 3));
  if (indices) merged.setIndex(new THREE.BufferAttribute(indices, 1));

  merged.computeVertexNormals();
  return merged;
}

export const Chess3DScene: React.FC<Chess3DSceneProps> = ({
  board,
  selectedSquare,
  validDestinations,
  activeColor: _activeColor,
  myColor = 'w',
  onTileClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const selectedSquareRef = useRef(selectedSquare);
  const validDestinationsRef = useRef(validDestinations);
  const onTileClickRef = useRef(onTileClick);

  // Keep refs up-to-date for raycasting & event handlers without breaking animation loops
  useEffect(() => {
    selectedSquareRef.current = selectedSquare;
    validDestinationsRef.current = validDestinations;
    onTileClickRef.current = onTileClick;
  }, [selectedSquare, validDestinations, onTileClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03060e);

    // Camera angled to match reference photo perspective (centered view of board)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    if (myColor === 'b') {
      camera.position.set(0, 8.5, -9.5);
    } else {
      camera.position.set(0, 8.5, 9.5);
    }
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // --- ORBITCONTROLS SETUP ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.4, 0);
    controls.minDistance = 4.5;
    controls.maxDistance = 16.0;
    controls.minPolarAngle = Math.PI / 12; // ~15° elevated view (prevents looking under board)
    controls.maxPolarAngle = Math.PI / 2.25; // ~80° top-down view (prevents extreme low clipping)
    controls.maxAzimuthAngle = Infinity;
    controls.minAzimuthAngle = -Infinity;
    controlsRef.current = controls;

    // --- LIGHTING SETUP (STUDIO CINEMATIC LIGHTING MATCHING PHOTO) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainSpot = new THREE.DirectionalLight(0xffffff, 1.4);
    mainSpot.position.set(-6, 12, 8);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    mainSpot.shadow.bias = -0.0001;
    scene.add(mainSpot);

    // Subtle blue rim light for Cyber Cyan theme specular reflections
    const cyanRim = new THREE.PointLight(0x06b6d4, 1.4, 16);
    cyanRim.position.set(6, 6, -6);
    scene.add(cyanRim);

    // Warm gold fill light for Gold theme specular reflections
    const amberFill = new THREE.PointLight(0xf59e0b, 1.1, 16);
    amberFill.position.set(-6, 5, -5);
    scene.add(amberFill);

    // --- BOARD MESHES CREATION (DARK LUXURY BOARD MATCHING REFERENCE PHOTO) ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 1. Dark Luxury Wood Base Frame (Stepped bevel border)
    const outerBaseGeo = new THREE.BoxGeometry(9.6, 0.45, 9.6);
    const outerBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1c1310, // Dark luxury wood
      roughness: 0.4,
      metalness: 0.2
    });
    const outerBase = new THREE.Mesh(outerBaseGeo, outerBaseMat);
    outerBase.position.set(0, -0.225, 0);
    outerBase.receiveShadow = true;
    boardGroup.add(outerBase);

    // Bevelled gold accent line border around 8x8 playing field (Matching photo gold trim)
    const lineBorderGeo = new THREE.BoxGeometry(8.18, 0.02, 8.18);
    const lineBorderMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold trim
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x996515,
      emissiveIntensity: 0.25
    });
    const lineBorder = new THREE.Mesh(lineBorderGeo, lineBorderMat);
    lineBorder.position.set(0, 0.001, 0);
    boardGroup.add(lineBorder);

    // 2. 8x8 Board Tiles (Cream Ivory & Dark Mahogany matching reference photo)
    const tileGroup = new THREE.Group();
    boardGroup.add(tileGroup);

    const whiteSquareMat = new THREE.MeshStandardMaterial({
      color: 0xf4e8d1, // Warm Cream Ivory
      roughness: 0.2,
      metalness: 0.05
    });

    const darkSquareMat = new THREE.MeshStandardMaterial({
      color: 0x4a1a12, // Rich Deep Mahogany Wood
      roughness: 0.3,
      metalness: 0.1
    });

    const tileMeshes: THREE.Mesh[][] = [];

    for (let r = 0; r < 8; r++) {
      tileMeshes[r] = [];
      for (let c = 0; c < 8; c++) {
        const isDark = (r + c) % 2 === 1;
        const tileGeo = new THREE.BoxGeometry(1.0, 0.05, 1.0);
        const tileMat = (isDark ? darkSquareMat : whiteSquareMat).clone();

        const tileMesh = new THREE.Mesh(tileGeo, tileMat);
        const x = c - 3.5;
        const z = r - 3.5;
        tileMesh.position.set(x, 0.025, z);
        tileMesh.receiveShadow = true;
        tileMesh.userData = { row: r, col: c, baseColor: tileMat.color.getHex() };

        tileGroup.add(tileMesh);
        tileMeshes[r][c] = tileMesh;
      }
    }

    // --- MATERIALS FOR 3D CHESS PIECES (CYAN AND GOLD MANDATORY THEME) ---
    // Player ('w') Pieces: Rich Vibrant Metallic Cyber Cyan
    const whitePieceMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyber Cyan
      roughness: 0.18,
      metalness: 0.40,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15
    });

    const cyanBaseMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4
    });

    // Bot ('b') Pieces: Rich Vibrant Metallic Cyber Gold
    const blackPieceMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Cyber Gold
      roughness: 0.18,
      metalness: 0.50,
      emissive: 0x78350f,
      emissiveIntensity: 0.15
    });

    const amberBaseMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4
    });

    // Destination target marker geometry (Glowing green pulsing ring)
    const targetRingGeo = new THREE.RingGeometry(0.18, 0.36, 32);
    targetRingGeo.rotateX(-Math.PI / 2);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    // Selected square ring halo geometry
    const selectRingGeo = new THREE.RingGeometry(0.40, 0.46, 32);
    selectRingGeo.rotateX(-Math.PI / 2);
    const selectRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    const activeOverlayGroup = new THREE.Group();
    scene.add(activeOverlayGroup);

    // --- 3D PIECES MANAGEMENT ---
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);

    const updatePiecePositions = () => {
      // Clear overlay rings
      while (activeOverlayGroup.children.length > 0) {
        activeOverlayGroup.remove(activeOverlayGroup.children[0]);
      }

      // 1. Render Destination Target Markers
      if (validDestinationsRef.current) {
        validDestinationsRef.current.forEach(([tr, tc]) => {
          const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
          targetRing.position.set(tc - 3.5, 0.06, tr - 3.5);
          activeOverlayGroup.add(targetRing);
        });
      }

      // 2. Render Selected Square Halo
      if (selectedSquareRef.current) {
        const [sr, sc] = selectedSquareRef.current;
        const selectRing = new THREE.Mesh(selectRingGeo, selectRingMat);
        selectRing.position.set(sc - 3.5, 0.06, sr - 3.5);
        activeOverlayGroup.add(selectRing);
      }

      // 3. Synchronize 3D Piece Meshes with board array
      const activeKeys = new Set<string>();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece) continue;

          // Unique key per tile occupancy
          const key = `${r}_${c}_${piece.type}_${piece.color}`;
          activeKeys.add(key);

          const targetX = c - 3.5;
          const targetZ = r - 3.5;
          const isSelected = selectedSquareRef.current && selectedSquareRef.current[0] === r && selectedSquareRef.current[1] === c;
          const targetY = isSelected ? 0.35 : 0.05; // Lift selected 3D piece smoothly

          let pieceGroup = pieceMeshesRef.current.get(key);

          if (!pieceGroup) {
            // Build new 3D Piece Group
            pieceGroup = new THREE.Group();

            const isPlayer = piece.color === 'w';
            const bodyMat = isPlayer ? whitePieceMat : blackPieceMat;
            const ringMat = isPlayer ? cyanBaseMat : amberBaseMat;

            // Main Staunton Body Mesh
            const mainGeo = getPieceGeometry(piece.type);
            const mainMesh = new THREE.Mesh(mainGeo, bodyMat);
            mainMesh.castShadow = true;
            mainMesh.receiveShadow = true;

            // Knights face forward (towards opponent)
            if (piece.type === 'n') {
              mainMesh.rotation.y = isPlayer ? Math.PI : 0;
            }

            pieceGroup.add(mainMesh);

            // Glowing accent ring base pedestal embedded underneath base disc
            const baseRingGeo = new THREE.CylinderGeometry(0.425, 0.435, 0.015, 36);
            const baseRingMesh = new THREE.Mesh(baseRingGeo, ringMat);
            baseRingMesh.position.y = 0.0075;
            pieceGroup.add(baseRingMesh);

            pieceGroup.position.set(targetX, targetY, targetZ);
            pieceGroup.userData = { row: r, col: c, piece };

            piecesGroup.add(pieceGroup);
            pieceMeshesRef.current.set(key, pieceGroup);
          } else {
            // Smoothly lerp towards target position
            pieceGroup.position.x += (targetX - pieceGroup.position.x) * 0.25;
            pieceGroup.position.z += (targetZ - pieceGroup.position.z) * 0.25;
            pieceGroup.position.y += (targetY - pieceGroup.position.y) * 0.25;
          }
        }
      }

      // Remove stale piece meshes (captured pieces or moved pieces)
      pieceMeshesRef.current.forEach((mesh, k) => {
        if (!activeKeys.has(k)) {
          piecesGroup.remove(mesh);
          pieceMeshesRef.current.delete(k);
        }
      });
    };

    // --- SMART INPUT DISCRIMINATION (CAMERA DRAG VS PIECE SELECTION TAP) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
      pointerDownTime = Date.now();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dx = event.clientX - pointerDownPos.x;
      const dy = event.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const duration = Date.now() - pointerDownTime;

      // If pointer moved < 6px and held < 350ms, treat as a piece/tile selection tap
      if (dist < 6 && duration < 350) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Check intersections against 8x8 tiles
        const intersects = raycaster.intersectObjects(tileGroup.children, true);
        if (intersects.length > 0) {
          const hitTile = intersects[0].object as THREE.Mesh;
          if (hitTile.userData && typeof hitTile.userData.row === 'number') {
            onTileClickRef.current(hitTile.userData.row, hitTile.userData.col);
          }
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);

    // --- ANIMATION LOOP & RESIZING ---
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      controls.update();
      updatePiecePositions();

      // Subtle pulse on target rings
      targetRingMat.opacity = 0.65 + Math.sin(Date.now() * 0.006) * 0.25;
      selectRingMat.opacity = 0.75 + Math.cos(Date.now() * 0.008) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- CLEANUP ON UNMOUNT ---
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();

      pieceMeshesRef.current.clear();
      renderer.dispose();

      whiteSquareMat.dispose();
      darkSquareMat.dispose();
      whitePieceMat.dispose();
      blackPieceMat.dispose();
      cyanBaseMat.dispose();
      amberBaseMat.dispose();
      targetRingMat.dispose();
      selectRingMat.dispose();

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [board]);

  const handleResetView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (myColor === 'b') {
      camera.position.set(0, 8.5, -9.5);
    } else {
      camera.position.set(0, 8.5, 9.5);
    }
    controls.target.set(0, 0.4, 0);
    controls.update();
  };

  return (
    <div className="w-full h-full min-h-[420px] max-h-[550px] relative rounded-2xl overflow-hidden select-none group">
      {/* Three.js WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Viewport Top HUD Controls Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
        {/* Camera interaction hint badge */}
        <div className="bg-[#040810]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[9.5px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
          <Move3d className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>Drag to Orbit • Scroll to Zoom • Tap Piece to Select</span>
        </div>

        {/* Reset Camera View Button */}
        <button
          onClick={handleResetView}
          className="pointer-events-auto bg-[#070D18]/90 hover:bg-[#0c1629] border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer active:scale-95"
          title="Reset Camera View to Default Angle"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          <span>Reset View</span>
        </button>
      </div>
    </div>
  );
};
