/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DraftPiece } from '../types';
import { RotateCcw, Eye, Compass } from 'lucide-react';

interface Draft3DSceneProps {
  pieces: DraftPiece[];
  player1Id: string;
  selectedPieceId: string | null;
  validDestinations: Array<[number, number]>;
  isPlayerTurn: boolean;
  onTileClick: (row: number, col: number) => void;
  onPieceClick: (pieceId: string) => void;
}

// Global cached geometry factory for optimum WebGL performance
const geometryCache: Record<string, THREE.BufferGeometry> = {};

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

// Create deep 3D piece main body geometry with substantial depth, heavy bevels & multi-tiered rims
function getPieceBodyGeometry(isKing: boolean): THREE.BufferGeometry {
  const cacheKey = isKing ? 'piece_body_king_deep' : 'piece_body_normal_deep';
  if (geometryCache[cacheKey]) return geometryCache[cacheKey];

  const layers = isKing ? 2 : 1;
  const geos: THREE.BufferGeometry[] = [];
  const layerHeight = 0.26; // Substantial depth per disk

  for (let l = 0; l < layers; l++) {
    const yOffset = l * layerHeight;
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.36, 0.0),
      new THREE.Vector2(0.40, 0.03),  // Heavy bevelled base
      new THREE.Vector2(0.41, 0.08),  // Lower rim step
      new THREE.Vector2(0.39, 0.10),  // Inset side groove bottom
      new THREE.Vector2(0.39, 0.17),  // Inset side groove top
      new THREE.Vector2(0.41, 0.19),  // Upper rim step
      new THREE.Vector2(0.40, 0.23),  // Upper shoulder
      new THREE.Vector2(0.36, 0.26),  // Top bevelled cap
      new THREE.Vector2(0.30, 0.24),  // Top recessed outer ring
      new THREE.Vector2(0.24, 0.25),  // Middle concentric ridge
      new THREE.Vector2(0.18, 0.24),  // Inner recessed dish
      new THREE.Vector2(0, 0.24)
    ];
    const lathe = new THREE.LatheGeometry(points, 40);
    lathe.translate(0, yOffset, 0);
    geos.push(lathe);

    // Inner concentric ridged rings on top face
    const innerRing1: THREE.Vector2[] = [
      new THREE.Vector2(0.28, 0.24),
      new THREE.Vector2(0.30, 0.26),
      new THREE.Vector2(0.32, 0.24)
    ];
    const ringGeo1 = new THREE.LatheGeometry(innerRing1, 40);
    ringGeo1.translate(0, yOffset, 0);
    geos.push(ringGeo1);

    const innerRing2: THREE.Vector2[] = [
      new THREE.Vector2(0.18, 0.24),
      new THREE.Vector2(0.20, 0.26),
      new THREE.Vector2(0.22, 0.24)
    ];
    const ringGeo2 = new THREE.LatheGeometry(innerRing2, 40);
    ringGeo2.translate(0, yOffset, 0);
    geos.push(ringGeo2);
  }

  const merged = mergeGeometries(geos);
  geometryCache[cacheKey] = merged;
  return merged;
}

// Create side glowing ring band geometry with prominent thickness
function getPieceSideRingGeometry(isKing: boolean): THREE.BufferGeometry {
  const cacheKey = isKing ? 'piece_ring_king_deep' : 'piece_ring_normal_deep';
  if (geometryCache[cacheKey]) return geometryCache[cacheKey];

  const layers = isKing ? 2 : 1;
  const geos: THREE.BufferGeometry[] = [];
  const layerHeight = 0.26;

  for (let l = 0; l < layers; l++) {
    const yOffset = l * layerHeight;
    // Outer side glowing band
    const ring = new THREE.CylinderGeometry(0.395, 0.395, 0.08, 40, 1, true);
    ring.translate(0, 0.135 + yOffset, 0);
    geos.push(ring);
  }

  const merged = mergeGeometries(geos);
  geometryCache[cacheKey] = merged;
  return merged;
}

// Create top emblem geometry (3D Starburst insignia & King Crown)
function getPieceEmblemGeometry(isKing: boolean): THREE.BufferGeometry {
  const cacheKey = isKing ? 'piece_emblem_king_deep' : 'piece_emblem_normal_deep';
  if (geometryCache[cacheKey]) return geometryCache[cacheKey];

  const yTop = isKing ? 0.52 : 0.24;
  const geos: THREE.BufferGeometry[] = [];

  if (isKing) {
    // Ornate 3D Crown Insignia for King
    const crownPoints = 6;
    for (let i = 0; i < crownPoints; i++) {
      const angle = (i * Math.PI * 2) / crownPoints;
      const point = new THREE.ConeGeometry(0.04, 0.14, 8);
      point.translate(0.13 * Math.cos(angle), yTop + 0.07, 0.13 * Math.sin(angle));
      geos.push(point);
    }
    const crownBase = new THREE.CylinderGeometry(0.15, 0.16, 0.05, 24);
    crownBase.translate(0, yTop + 0.025, 0);
    geos.push(crownBase);

    // Center Gem / Cross
    const centerGem = new THREE.OctahedronGeometry(0.065);
    centerGem.translate(0, yTop + 0.09, 0);
    geos.push(centerGem);
  } else {
    // 8-Pointed Starburst Insignia with 3D extrude depth
    const starShape = new THREE.Shape();
    const pointsCount = 8;
    const outerRadius = 0.15;
    const innerRadius = 0.08;

    for (let i = 0; i < pointsCount * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / pointsCount;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const extrudeSettings = {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008
    };

    const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeo.rotateX(Math.PI / 2);
    starGeo.translate(0, yTop + 0.015, 0);
    geos.push(starGeo);

    // Center dot emblem
    const centerDot = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16);
    centerDot.translate(0, yTop + 0.02, 0);
    geos.push(centerDot);
  }

  const merged = mergeGeometries(geos);
  geometryCache[cacheKey] = merged;
  return merged;
}

// Create bevelled individual tile geometry for authentic checkers board look
function createBevelledTileGeometry(width: number, height: number, depth: number, bevel: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w2 = width / 2 - bevel;
  const d2 = depth / 2 - bevel;

  shape.moveTo(-w2, -d2);
  shape.lineTo(w2, -d2);
  shape.lineTo(w2, d2);
  shape.lineTo(-w2, d2);
  shape.closePath();

  const extrudeSettings = {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export const Draft3DScene: React.FC<Draft3DSceneProps> = ({
  pieces,
  player1Id,
  selectedPieceId,
  validDestinations,
  isPlayerTurn: _isPlayerTurn,
  onTileClick,
  onPieceClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pieceMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const tileMeshesRef = useRef<THREE.Mesh[][]>([]);

  // Camera Orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 3.4, radius: 10.8 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.25, 0));

  // Refs for current props in animation/event handlers
  const piecesRef = useRef(pieces);
  const selectedPieceIdRef = useRef(selectedPieceId);
  const validDestinationsRef = useRef(validDestinations);
  const onTileClickRef = useRef(onTileClick);
  const onPieceClickRef = useRef(onPieceClick);
  const hoveredTileRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    piecesRef.current = pieces;
    selectedPieceIdRef.current = selectedPieceId;
    validDestinationsRef.current = validDestinations;
    onTileClickRef.current = onTileClick;
    onPieceClickRef.current = onPieceClick;
  }, [pieces, selectedPieceId, validDestinations, onTileClick, onPieceClick]);

  // View Controls
  const resetCamera = () => {
    cameraAngleRef.current = { theta: 0, phi: Math.PI / 3.4, radius: 10.8 };
  };

  const topDownCamera = () => {
    cameraAngleRef.current = { theta: 0, phi: Math.PI / 2.05, radius: 9.2 };
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    
    const clampedPhi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi));
    cameraAngleRef.current.phi = clampedPhi;

    const y = radius * Math.cos(clampedPhi);
    const horizontalRadius = radius * Math.sin(clampedPhi);
    const x = horizontalRadius * Math.sin(theta);
    const z = horizontalRadius * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAtRef.current);
  };

  // Materials
  const cyanGlowMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.85
    })
  ).current;

  const goldGlowMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.85
    })
  ).current;

  // Deep metallic cyan piece body
  const bodyDarkMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x091c28,
      roughness: 0.20,
      metalness: 0.90,
      envMapIntensity: 1.2
    })
  ).current;

  // Deep metallic gold/bronze piece body
  const bodyGoldDarkMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x241a0b,
      roughness: 0.20,
      metalness: 0.90,
      envMapIntensity: 1.2
    })
  ).current;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x03060e);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(6, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-6, 8, -6);
    scene.add(fillLight);

    // Cyan and Gold Accent Point Lights
    const cyanLight = new THREE.PointLight(0x06b6d4, 4.0, 14);
    cyanLight.position.set(-4.5, 4, 4.5);
    scene.add(cyanLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 4.0, 14);
    goldLight.position.set(4.5, 4, -4.5);
    scene.add(goldLight);

    // --- REALISTIC CHECKERS BOARD STRUCTURE ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 1. Solid Board Base / Pedestal (Heavy mahogany / dark obsidian base)
    const basePedestalGeo = new THREE.BoxGeometry(9.8, 0.45, 9.8);
    const basePedestalMat = new THREE.MeshStandardMaterial({
      color: 0x050912,
      metalness: 0.9,
      roughness: 0.3
    });
    const basePedestalMesh = new THREE.Mesh(basePedestalGeo, basePedestalMat);
    basePedestalMesh.position.set(0, -0.25, 0);
    basePedestalMesh.receiveShadow = true;
    boardGroup.add(basePedestalMesh);

    // 2. Raised Wooden / Cyber Outer Border Frame Lip (giving realistic checkers board depth)
    const frameBorderMat = new THREE.MeshStandardMaterial({
      color: 0x091424,
      metalness: 0.85,
      roughness: 0.25
    });

    // 4 Border Raised Frame Rails
    const frameRailWidth = 9.4;
    const frameRailThickness = 0.55;
    const frameRailHeight = 0.18;

    // Top rail
    const railTopGeo = new THREE.BoxGeometry(frameRailWidth, frameRailHeight, frameRailThickness);
    const railTop = new THREE.Mesh(railTopGeo, frameBorderMat);
    railTop.position.set(0, 0.04, -4.325);
    railTop.castShadow = true;
    railTop.receiveShadow = true;
    boardGroup.add(railTop);

    // Bottom rail
    const railBottom = new THREE.Mesh(railTopGeo, frameBorderMat);
    railBottom.position.set(0, 0.04, 4.325);
    railBottom.castShadow = true;
    railBottom.receiveShadow = true;
    boardGroup.add(railBottom);

    // Left rail
    const railSideGeo = new THREE.BoxGeometry(frameRailThickness, frameRailHeight, frameRailWidth - frameRailThickness * 2);
    const railLeft = new THREE.Mesh(railSideGeo, frameBorderMat);
    railLeft.position.set(-4.325, 0.04, 0);
    railLeft.castShadow = true;
    railLeft.receiveShadow = true;
    boardGroup.add(railLeft);

    // Right rail
    const railRight = new THREE.Mesh(railSideGeo, frameBorderMat);
    railRight.position.set(4.325, 0.04, 0);
    railRight.castShadow = true;
    railRight.receiveShadow = true;
    boardGroup.add(railRight);

    // Brass/Cyan Metallic Corner Brackets (at 4 corners)
    const cornerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4
    });

    const cornersPos = [
      [-4.325, -4.325],
      [4.325, -4.325],
      [-4.325, 4.325],
      [4.325, 4.325]
    ];

    cornersPos.forEach(([cx, cz]) => {
      const cornerGeo = new THREE.BoxGeometry(0.60, 0.22, 0.60);
      const cornerMesh = new THREE.Mesh(cornerGeo, cornerMat);
      cornerMesh.position.set(cx, 0.05, cz);
      cornerMesh.castShadow = true;
      boardGroup.add(cornerMesh);
    });

    // Glowing Inner Perimeter Line
    const innerBorderLineGeo = new THREE.BoxGeometry(8.15, 0.02, 8.15);
    const innerBorderLineMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 2.0
    });
    const innerBorderLineMesh = new THREE.Mesh(innerBorderLineGeo, innerBorderLineMat);
    innerBorderLineMesh.position.set(0, 0.01, 0);
    boardGroup.add(innerBorderLineMesh);

    // --- AUTHENTIC 3D CHECKERS TILES (8x8) ---
    const squareSize = 1.0;
    const tileGrid: THREE.Mesh[][] = [];

    // Light Squares: Frosted Cyber Slate Blue Tile with Bevelled Edge & Inset Rim
    const lightTileMat = new THREE.MeshStandardMaterial({
      color: 0x162438,
      metalness: 0.6,
      roughness: 0.30,
      envMapIntensity: 1.0
    });

    // Dark Squares: Rich Obsidian / Carbon Checkers Tile with Deep Bevel
    const darkTileMat = new THREE.MeshStandardMaterial({
      color: 0x060c16,
      metalness: 0.8,
      roughness: 0.20,
      envMapIntensity: 1.2
    });

    // Tile Bevel Geometry
    const tileBevelGeo = createBevelledTileGeometry(0.96, 0.08, 0.96, 0.025);

    for (let r = 0; r < 8; r++) {
      tileGrid[r] = [];
      for (let c = 0; c < 8; c++) {
        const isDark = (r + c) % 2 === 1;
        const tileMesh = new THREE.Mesh(
          tileBevelGeo,
          isDark ? darkTileMat.clone() : lightTileMat.clone()
        );

        const x = (c - 3.5) * squareSize;
        const z = (r - 3.5) * squareSize;
        tileMesh.position.set(x, 0, z);
        tileMesh.receiveShadow = true;
        tileMesh.userData = { row: r, col: c, isDark };

        boardGroup.add(tileMesh);
        tileGrid[r][c] = tileMesh;

        // Add subtle inner border line for light tiles to match physical checkers board feel
        if (!isDark) {
          const innerInlayGeo = new THREE.BoxGeometry(0.86, 0.085, 0.86);
          const innerInlayMat = new THREE.MeshStandardMaterial({
            color: 0x1d304a,
            metalness: 0.5,
            roughness: 0.35
          });
          const innerInlay = new THREE.Mesh(innerInlayGeo, innerInlayMat);
          innerInlay.position.set(x, 0.001, z);
          innerInlay.receiveShadow = true;
          boardGroup.add(innerInlay);
        } else {
          // Dark tile under-glow accent grid lines in grout gaps
          const gapGlowGeo = new THREE.BoxGeometry(0.98, 0.005, 0.98);
          const gapGlowMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.3
          });
          const gapGlow = new THREE.Mesh(gapGlowGeo, gapGlowMat);
          gapGlow.position.set(x, -0.035, z);
          boardGroup.add(gapGlow);
        }
      }
    }
    tileMeshesRef.current = tileGrid;

    // --- SELECTION & DESTINATION HIGHLIGHT OVERLAYS ---
    const selectionRingGeo = new THREE.RingGeometry(0.32, 0.44, 32);
    selectionRingGeo.rotateX(-Math.PI / 2);
    const selectionRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const selectionRingMesh = new THREE.Mesh(selectionRingGeo, selectionRingMat);
    selectionRingMesh.position.set(0, 0.045, 0);
    selectionRingMesh.visible = false;
    scene.add(selectionRingMesh);

    // Valid target destination markers pool
    const targetMarkerGroup = new THREE.Group();
    scene.add(targetMarkerGroup);

    // --- RAYCASTING & EVENT HANDLERS ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = false;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (e.buttons === 1) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          isDraggingRef.current = true;
        }

        cameraAngleRef.current.theta -= deltaX * 0.008;
        cameraAngleRef.current.phi -= deltaY * 0.008;
        updateCameraPosition();

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const allTiles: THREE.Mesh[] = [];
      tileMeshesRef.current.forEach(row => row.forEach(t => allTiles.push(t)));
      const intersects = raycaster.intersectObjects(allTiles);

      if (intersects.length > 0) {
        const hitTile = intersects[0].object as THREE.Mesh;
        const { row, col } = hitTile.userData;
        hoveredTileRef.current = [row, col];
        container.style.cursor = 'pointer';
      } else {
        hoveredTileRef.current = null;
        container.style.cursor = 'default';
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const allTiles: THREE.Mesh[] = [];
      tileMeshesRef.current.forEach(row => row.forEach(t => allTiles.push(t)));
      const tileIntersects = raycaster.intersectObjects(allTiles);

      const activePieceGroupList: THREE.Object3D[] = [];
      pieceMeshesRef.current.forEach(group => activePieceGroupList.push(group));
      const pieceIntersects = raycaster.intersectObjects(activePieceGroupList, true);

      // If a piece is already selected, check if clicking a valid destination tile first
      if (selectedPieceIdRef.current && tileIntersects.length > 0) {
        const hitTile = tileIntersects[0].object as THREE.Mesh;
        const { row, col } = hitTile.userData;
        const isValidTarget = validDestinationsRef.current.some(([vr, vc]) => vr === row && vc === col);
        if (isValidTarget) {
          onTileClickRef.current(row, col);
          return;
        }
      }

      if (pieceIntersects.length > 0) {
        let parentGroup: THREE.Object3D | null = pieceIntersects[0].object;
        while (parentGroup && !parentGroup.userData.pieceId && parentGroup.parent) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.pieceId) {
          onPieceClickRef.current(parentGroup.userData.pieceId);
          return;
        }
      }

      if (tileIntersects.length > 0) {
        const hitTile = tileIntersects[0].object as THREE.Mesh;
        const { row, col } = hitTile.userData;
        onTileClickRef.current(row, col);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius += e.deltaY * 0.005;
      cameraAngleRef.current.radius = Math.max(5.0, Math.min(18.0, cameraAngleRef.current.radius));
      updateCameraPosition();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
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

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Emissive pulse on side rings
      cyanGlowMat.emissiveIntensity = 2.2 + Math.sin(elapsedTime * 3.5) * 0.6;
      goldGlowMat.emissiveIntensity = 2.2 + Math.cos(elapsedTime * 3.5) * 0.6;

      // Update piece positions smoothly & render bobbing for selected piece
      piecesRef.current.forEach(piece => {
        const meshGroup = pieceMeshesRef.current.get(piece.id);
        if (!meshGroup) return;

        const targetX = (piece.position.col - 3.5) * squareSize;
        const targetZ = (piece.position.row - 3.5) * squareSize;
        const isSelected = piece.id === selectedPieceIdRef.current;

        const targetY = isSelected ? 0.22 + Math.sin(elapsedTime * 6.0) * 0.06 : 0.04;

        meshGroup.position.x += (targetX - meshGroup.position.x) * 0.25;
        meshGroup.position.z += (targetZ - meshGroup.position.z) * 0.25;
        meshGroup.position.y += (targetY - meshGroup.position.y) * 0.25;

        if (isSelected) {
          selectionRingMesh.position.set(meshGroup.position.x, 0.05, meshGroup.position.z);
          selectionRingMesh.visible = true;
          selectionRingMesh.rotation.z = elapsedTime * 1.5;
        }
      });

      if (!selectedPieceIdRef.current) {
        selectionRingMesh.visible = false;
      }

      // Update valid target markers highlight pool
      while (targetMarkerGroup.children.length > 0) {
        const child = targetMarkerGroup.children[0];
        targetMarkerGroup.remove(child);
      }

      validDestinationsRef.current.forEach(([vr, vc]) => {
        const tx = (vc - 3.5) * squareSize;
        const tz = (vr - 3.5) * squareSize;

        // Glowing emerald target disc
        const markerGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.02, 24);
        const markerMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.45 + Math.sin(elapsedTime * 6) * 0.25
        });
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.position.set(tx, 0.045, tz);
        targetMarkerGroup.add(markerMesh);

        // Target pulsing ring
        const ringGeo = new THREE.RingGeometry(0.39, 0.46, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x34d399,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(tx, 0.05, tz);
        targetMarkerGroup.add(ringMesh);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // --- SYNC PIECE MESHES WITH REACT STATE ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentPieceMap = pieceMeshesRef.current;
    const activeIds = new Set(pieces.map(p => p.id));

    currentPieceMap.forEach((group, id) => {
      if (!activeIds.has(id)) {
        scene.remove(group);
        currentPieceMap.delete(id);
      }
    });

    pieces.forEach(piece => {
      const isPlayer1 = piece.playerId === player1Id;
      const bodyMat = isPlayer1 ? bodyDarkMat : bodyGoldDarkMat;
      const glowMat = isPlayer1 ? cyanGlowMat : goldGlowMat;

      let group = currentPieceMap.get(piece.id);

      if (!group || group.userData.isKing !== piece.isKing) {
        if (group) scene.remove(group);

        group = new THREE.Group();
        group.userData = { pieceId: piece.id, isKing: piece.isKing };

        // Main cylindrical metallic piece body with substantial depth
        const bodyGeo = getPieceBodyGeometry(piece.isKing);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        // Side glowing ring band with ridged grid pattern
        const sideRingGeo = getPieceSideRingGeometry(piece.isKing);
        const sideRingMesh = new THREE.Mesh(sideRingGeo, glowMat);
        group.add(sideRingMesh);

        // Top Emblem / Crown insignia
        const emblemGeo = getPieceEmblemGeometry(piece.isKing);
        const emblemMesh = new THREE.Mesh(emblemGeo, glowMat);
        group.add(emblemMesh);

        const x = (piece.position.col - 3.5) * 1.0;
        const z = (piece.position.row - 3.5) * 1.0;
        group.position.set(x, 0.04, z);

        scene.add(group);
        currentPieceMap.set(piece.id, group);
      }
    });
  }, [pieces, player1Id]);

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[520px] rounded-2xl overflow-hidden bg-[#03060e] select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3D CANVAS OVERLAY CAMERA CONTROL TOOLBAR */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-[#09111e]/80 backdrop-blur-md p-1.5 rounded-xl border border-cyan-500/30 z-20 shadow-lg">
        <button
          onClick={resetCamera}
          className="p-1.5 px-2.5 bg-neutral-900/90 hover:bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          title="Reset Camera Angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Perspective</span>
        </button>
        <button
          onClick={topDownCamera}
          className="p-1.5 px-2.5 bg-neutral-900/90 hover:bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          title="Top-Down View"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Top Down</span>
        </button>
      </div>

      <div className="absolute bottom-3 right-3 bg-[#09111e]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/20 text-[10px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none z-20">
        <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
        <span>Drag to rotate • Scroll to zoom</span>
      </div>
    </div>
  );
};
