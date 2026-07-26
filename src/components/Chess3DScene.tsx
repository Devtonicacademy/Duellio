/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
  onTileClick: (row: number, col: number) => void;
}

// Global cached geometry factory for smooth performance and zero memory leaks
const geometryCache: Record<string, THREE.BufferGeometry> = {};

function getPieceGeometry(type: PieceType): THREE.BufferGeometry {
  if (geometryCache[type]) {
    return geometryCache[type];
  }

  let geo: THREE.BufferGeometry;

  if (type === 'p') { // Pawn
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.38, 0.05),
      new THREE.Vector2(0.32, 0.09),
      new THREE.Vector2(0.34, 0.12),
      new THREE.Vector2(0.24, 0.16),
      new THREE.Vector2(0.14, 0.38),
      new THREE.Vector2(0.20, 0.42),
      new THREE.Vector2(0.12, 0.46),
      new THREE.Vector2(0.18, 0.60),
      new THREE.Vector2(0, 0.65)
    ];
    const lathe = new THREE.LatheGeometry(points, 32);
    // Head ball
    const head = new THREE.SphereGeometry(0.16, 24, 24);
    head.translate(0, 0.62, 0);
    geo = mergeGeometries([lathe, head]);
  } 
  else if (type === 'r') { // Rook / Castle
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.38, 0.06),
      new THREE.Vector2(0.32, 0.10),
      new THREE.Vector2(0.35, 0.14),
      new THREE.Vector2(0.25, 0.18),
      new THREE.Vector2(0.24, 0.52),
      new THREE.Vector2(0.32, 0.58),
      new THREE.Vector2(0.32, 0.76),
      new THREE.Vector2(0.26, 0.76),
      new THREE.Vector2(0.26, 0.68),
      new THREE.Vector2(0, 0.68)
    ];
    const lathe = new THREE.LatheGeometry(points, 32);

    // Castellated parapet cutouts (merlons)
    const merlonGeos: THREE.BufferGeometry[] = [lathe];
    const merlonCount = 4;
    for (let i = 0; i < merlonCount; i++) {
      const angle = (i * Math.PI * 2) / merlonCount;
      const m = new THREE.BoxGeometry(0.12, 0.12, 0.08);
      m.translate(0, 0.74, 0.27);
      m.rotateY(angle);
      merlonGeos.push(m);
    }
    geo = mergeGeometries(merlonGeos);
  }
  else if (type === 'n') { // Knight (Horse)
    // Base pedestal
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.38, 0.06),
      new THREE.Vector2(0.32, 0.10),
      new THREE.Vector2(0.34, 0.14),
      new THREE.Vector2(0.25, 0.22),
      new THREE.Vector2(0, 0.24)
    ];
    const baseGeo = new THREE.LatheGeometry(points, 32);

    // 3D Extruded Horse Silhouette
    const shape = new THREE.Shape();
    shape.moveTo(-0.15, 0.22);
    shape.lineTo(-0.18, 0.45);
    shape.lineTo(-0.12, 0.65);
    shape.lineTo(-0.06, 0.85); // Mane crest
    shape.lineTo(0.08, 0.88);  // Ears
    shape.lineTo(0.15, 0.75);  // Forehead
    shape.lineTo(0.24, 0.60);  // Snout top
    shape.lineTo(0.18, 0.48);  // Chin / Muzzle
    shape.lineTo(0.08, 0.42);  // Jaw curve
    shape.lineTo(0.04, 0.22);  // Base join
    shape.closePath();

    const extrudeSettings = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03
    };
    const headGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    headGeo.center();
    headGeo.translate(0, 0.54, 0);

    geo = mergeGeometries([baseGeo, headGeo]);
  }
  else if (type === 'b') { // Bishop
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.38, 0.06),
      new THREE.Vector2(0.32, 0.10),
      new THREE.Vector2(0.34, 0.14),
      new THREE.Vector2(0.24, 0.18),
      new THREE.Vector2(0.15, 0.48),
      new THREE.Vector2(0.23, 0.54),
      new THREE.Vector2(0.14, 0.58),
      new THREE.Vector2(0.24, 0.74),
      new THREE.Vector2(0.18, 0.88),
      new THREE.Vector2(0.06, 0.94),
      new THREE.Vector2(0, 0.94)
    ];
    const lathe = new THREE.LatheGeometry(points, 32);

    // Top finial sphere
    const finial = new THREE.SphereGeometry(0.07, 16, 16);
    finial.translate(0, 0.98, 0);

    geo = mergeGeometries([lathe, finial]);
  }
  else if (type === 'q') { // Queen
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.40, 0.0),
      new THREE.Vector2(0.40, 0.06),
      new THREE.Vector2(0.34, 0.10),
      new THREE.Vector2(0.36, 0.14),
      new THREE.Vector2(0.26, 0.20),
      new THREE.Vector2(0.16, 0.55),
      new THREE.Vector2(0.25, 0.62),
      new THREE.Vector2(0.16, 0.66),
      new THREE.Vector2(0.30, 0.96),
      new THREE.Vector2(0.20, 1.02),
      new THREE.Vector2(0, 1.02)
    ];
    const lathe = new THREE.LatheGeometry(points, 32);

    // Coronet points (mini spheres on crown rim)
    const coronetGeos: THREE.BufferGeometry[] = [lathe];
    const coronetCount = 8;
    for (let i = 0; i < coronetCount; i++) {
      const angle = (i * Math.PI * 2) / coronetCount;
      const ball = new THREE.SphereGeometry(0.045, 12, 12);
      ball.translate(0.28 * Math.cos(angle), 0.98, 0.28 * Math.sin(angle));
      coronetGeos.push(ball);
    }

    // Top finial
    const topBall = new THREE.SphereGeometry(0.08, 16, 16);
    topBall.translate(0, 1.08, 0);
    coronetGeos.push(topBall);

    geo = mergeGeometries(coronetGeos);
  }
  else { // King
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.42, 0.06),
      new THREE.Vector2(0.35, 0.10),
      new THREE.Vector2(0.37, 0.14),
      new THREE.Vector2(0.27, 0.22),
      new THREE.Vector2(0.17, 0.58),
      new THREE.Vector2(0.27, 0.65),
      new THREE.Vector2(0.17, 0.70),
      new THREE.Vector2(0.32, 1.04),
      new THREE.Vector2(0.26, 1.10),
      new THREE.Vector2(0.12, 1.14),
      new THREE.Vector2(0, 1.14)
    ];
    const lathe = new THREE.LatheGeometry(points, 32);

    // Cross on top of King's crown
    const vBar = new THREE.BoxGeometry(0.06, 0.22, 0.06);
    vBar.translate(0, 1.25, 0);
    const hBar = new THREE.BoxGeometry(0.16, 0.06, 0.06);
    hBar.translate(0, 1.27, 0);

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
  onTileClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
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

    // Camera angled to match photo (38° tilt, clear view of back rank & piece silhouettes)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 8.5, 9.5);
    camera.lookAt(0, 0.2, 0.2);

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

    // --- LIGHTING SETUP (STUDIO LIGHTING MATCHING PHOTO) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainSpot = new THREE.DirectionalLight(0xffffff, 1.3);
    mainSpot.position.set(-6, 12, 8);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    mainSpot.shadow.bias = -0.0001;
    scene.add(mainSpot);

    // Subtle blue rim highlight light for Cyber Cyan theme accenting
    const cyanRim = new THREE.PointLight(0x06b6d4, 1.2, 15);
    cyanRim.position.set(5, 6, -5);
    scene.add(cyanRim);

    // Warm gold fill light for Gold/Amber bot theme accenting
    const amberFill = new THREE.PointLight(0xf59e0b, 0.9, 15);
    amberFill.position.set(-5, 4, -4);
    scene.add(amberFill);

    // --- BOARD MESHES CREATION ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 1. Dark Wood / Matte Outer Border Base (Matching Photo)
    const outerBaseGeo = new THREE.BoxGeometry(9.6, 0.4, 9.6);
    const outerBaseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.2
    });
    const outerBase = new THREE.Mesh(outerBaseGeo, outerBaseMat);
    outerBase.position.set(0, -0.2, 0);
    outerBase.receiveShadow = true;
    boardGroup.add(outerBase);

    // Thin white border line around 8x8 playing field (Matching Photo)
    const lineBorderGeo = new THREE.BoxGeometry(8.16, 0.02, 8.16);
    const lineBorderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineBorder = new THREE.Mesh(lineBorderGeo, lineBorderMat);
    lineBorder.position.set(0, 0.001, 0);
    boardGroup.add(lineBorder);

    // 2. 8x8 Board Tiles (Alternating White & Charcoal Dark Squares matching photo)
    const tileGroup = new THREE.Group();
    boardGroup.add(tileGroup);

    const whiteSquareMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.05
    });

    const darkSquareMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
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
        // X coord: -3.5 to +3.5 (col 0 to 7)
        // Z coord: -3.5 to +3.5 (row 0 to 7)
        const x = c - 3.5;
        const z = r - 3.5;
        tileMesh.position.set(x, 0.025, z);
        tileMesh.receiveShadow = true;
        tileMesh.userData = { row: r, col: c, baseColor: tileMat.color.getHex() };

        tileGroup.add(tileMesh);
        tileMeshes[r][c] = tileMesh;
      }
    }

    // --- MATERIALS FOR 3D CHESS PIECES ---
    // Player ('w') Pieces: Rich Vibrant Glossy Cyber Cyan (Original Theme Color)
    const whitePieceMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.18,
      metalness: 0.35,
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

    // Bot ('b') Pieces: Rich Vibrant Glossy Cyber Gold / Amber (Original Theme Color)
    const blackPieceMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.18,
      metalness: 0.45,
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

            // Glowing accent ring base pedestal
            const baseRingGeo = new THREE.CylinderGeometry(0.39, 0.41, 0.03, 32);
            const baseRingMesh = new THREE.Mesh(baseRingGeo, ringMat);
            baseRingMesh.position.y = 0.015;
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

    // --- RAYCASTING FOR MOUSE & TOUCH TILE CLICKS ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
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
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);

    // --- ANIMATION LOOP & RESIZING ---
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

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

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[420px] max-h-[550px] relative rounded-2xl overflow-hidden cursor-pointer select-none"
    />
  );
};
