/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
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

// Create piece main body geometry (lathe profile matching draft_icon.png)
function getPieceBodyGeometry(isKing: boolean): THREE.BufferGeometry {
  const cacheKey = isKing ? 'piece_body_king' : 'piece_body_normal';
  if (geometryCache[cacheKey]) return geometryCache[cacheKey];

  const layers = isKing ? 2 : 1;
  const geos: THREE.BufferGeometry[] = [];

  for (let l = 0; l < layers; l++) {
    const yOffset = l * 0.18;
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.36, 0.0),
      new THREE.Vector2(0.39, 0.02),
      new THREE.Vector2(0.39, 0.06),
      new THREE.Vector2(0.40, 0.08),
      new THREE.Vector2(0.40, 0.13),
      new THREE.Vector2(0.39, 0.15),
      new THREE.Vector2(0.35, 0.18),
      new THREE.Vector2(0.30, 0.17),
      new THREE.Vector2(0.24, 0.18),
      new THREE.Vector2(0.16, 0.17),
      new THREE.Vector2(0, 0.17)
    ];
    const lathe = new THREE.LatheGeometry(points, 36);
    lathe.translate(0, yOffset, 0);
    geos.push(lathe);

    // Inner concentric ring ridge on top face
    const innerRingPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.20, 0.17),
      new THREE.Vector2(0.22, 0.19),
      new THREE.Vector2(0.24, 0.17)
    ];
    const ringGeo = new THREE.LatheGeometry(innerRingPoints, 36);
    ringGeo.translate(0, yOffset, 0);
    geos.push(ringGeo);
  }

  const merged = mergeGeometries(geos);
  geometryCache[cacheKey] = merged;
  return merged;
}

// Create side glowing ring geometry with grid segments
function getPieceSideRingGeometry(isKing: boolean): THREE.BufferGeometry {
  const cacheKey = isKing ? 'piece_ring_king' : 'piece_ring_normal';
  if (geometryCache[cacheKey]) return geometryCache[cacheKey];

  const layers = isKing ? 2 : 1;
  const geos: THREE.BufferGeometry[] = [];

  for (let l = 0; l < layers; l++) {
    const yOffset = l * 0.18;
    // Glowing ring band around side perimeter
    const ring = new THREE.CylinderGeometry(0.398, 0.398, 0.05, 32, 1, true);
    ring.translate(0, 0.095 + yOffset, 0);
    geos.push(ring);
  }

  const merged = mergeGeometries(geos);
  geometryCache[cacheKey] = merged;
  return merged;
}

// Create top emblem geometry (Starburst insignia matching draft_icon.png)
function getPieceEmblemGeometry(isKing: boolean): THREE.BufferGeometry {
  const cacheKey = isKing ? 'piece_emblem_king' : 'piece_emblem_normal';
  if (geometryCache[cacheKey]) return geometryCache[cacheKey];

  const yTop = isKing ? 0.35 : 0.17;
  const geos: THREE.BufferGeometry[] = [];

  if (isKing) {
    // 3D Crown Insignia for King
    const crownPoints = 5;
    for (let i = 0; i < crownPoints; i++) {
      const angle = (i * Math.PI * 2) / crownPoints;
      const point = new THREE.ConeGeometry(0.035, 0.10, 8);
      point.translate(0.12 * Math.cos(angle), yTop + 0.05, 0.12 * Math.sin(angle));
      geos.push(point);
    }
    const crownBase = new THREE.CylinderGeometry(0.14, 0.15, 0.04, 24);
    crownBase.translate(0, yTop + 0.02, 0);
    geos.push(crownBase);

    const centerGem = new THREE.OctahedronGeometry(0.05);
    centerGem.translate(0, yTop + 0.07, 0);
    geos.push(centerGem);
  } else {
    // 8-Pointed Starburst Insignia (like draft_icon.png)
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
      depth: 0.015,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005
    };

    const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeo.rotateX(Math.PI / 2);
    starGeo.translate(0, yTop + 0.01, 0);
    geos.push(starGeo);

    // Center dot emblem
    const centerDot = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    centerDot.translate(0, yTop + 0.015, 0);
    geos.push(centerDot);
  }

  const merged = mergeGeometries(geos);
  geometryCache[cacheKey] = merged;
  return merged;
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
  const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 3.5, radius: 10.5 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.3, 0));

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
    cameraAngleRef.current = { theta: 0, phi: Math.PI / 3.5, radius: 10.5 };
  };

  const topDownCamera = () => {
    cameraAngleRef.current = { theta: 0, phi: Math.PI / 2.05, radius: 9.0 };
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    
    // Clamp vertical tilt angle
    const clampedPhi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi));
    cameraAngleRef.current.phi = clampedPhi;

    const y = radius * Math.cos(clampedPhi);
    const horizontalRadius = radius * Math.sin(clampedPhi);
    const x = horizontalRadius * Math.sin(theta);
    const z = horizontalRadius * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAtRef.current);
  };

  // Build materials
  const cyanGlowMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8
    })
  ).current;

  const goldGlowMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8
    })
  ).current;

  const bodyDarkMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x0d131d,
      roughness: 0.25,
      metalness: 0.85
    })
  ).current;

  const bodyGoldDarkMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x1c170d,
      roughness: 0.25,
      metalness: 0.85
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(5, 12, 7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Cyan and Gold Accent Point Lights for dramatic specularity
    const cyanLight = new THREE.PointLight(0x06b6d4, 3.5, 12);
    cyanLight.position.set(-4, 3, 4);
    scene.add(cyanLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 3.5, 12);
    goldLight.position.set(4, 3, -4);
    scene.add(goldLight);

    // --- BOARD MATRIX (8x8) ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Dark metallic outer frame with chamfered edge (matching draft_bg.png)
    const frameGeo = new THREE.BoxGeometry(8.9, 0.35, 8.9);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x070e1a,
      metalness: 0.9,
      roughness: 0.2
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, -0.18, 0);
    frameMesh.receiveShadow = true;
    boardGroup.add(frameMesh);

    // Glowing perimeter border light strip
    const borderOutlineGeo = new THREE.BoxGeometry(8.42, 0.02, 8.42);
    const borderOutlineMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.8
    });
    const borderOutlineMesh = new THREE.Mesh(borderOutlineGeo, borderOutlineMat);
    borderOutlineMesh.position.set(0, 0.001, 0);
    boardGroup.add(borderOutlineMesh);

    // Tiles (8x8)
    const squareSize = 1.0;
    const tileGrid: THREE.Mesh[][] = [];

    const lightTileMat = new THREE.MeshStandardMaterial({
      color: 0x0e1726,
      metalness: 0.5,
      roughness: 0.4
    });

    const darkTileMat = new THREE.MeshStandardMaterial({
      color: 0x050c18,
      metalness: 0.7,
      roughness: 0.25
    });

    for (let r = 0; r < 8; r++) {
      tileGrid[r] = [];
      for (let c = 0; c < 8; c++) {
        const isDark = (r + c) % 2 === 1;
        const tileGeo = new THREE.BoxGeometry(squareSize * 0.97, 0.1, squareSize * 0.97);
        const tileMesh = new THREE.Mesh(tileGeo, isDark ? darkTileMat.clone() : lightTileMat.clone());

        // Map r (0..7) to Z (-3.5..3.5), c (0..7) to X (-3.5..3.5)
        const x = (c - 3.5) * squareSize;
        const z = (r - 3.5) * squareSize;
        tileMesh.position.set(x, -0.05, z);
        tileMesh.receiveShadow = true;
        tileMesh.userData = { row: r, col: c, isDark };

        boardGroup.add(tileMesh);
        tileGrid[r][c] = tileMesh;
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
    selectionRingMesh.position.set(0, 0.02, 0);
    selectionRingMesh.visible = false;
    scene.add(selectionRingMesh);

    // Valid target destination markers pool
    const targetMarkerGroup = new THREE.Group();
    scene.add(targetMarkerGroup);

    // --- RAYCASTING & EVENT HANDLERS ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click drag
      isDraggingRef.current = false;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      // Mouse drag rotation checking
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

      // Tile hover raycasting
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

      // Check piece clicks first
      const activePieceGroupList: THREE.Object3D[] = [];
      pieceMeshesRef.current.forEach(group => activePieceGroupList.push(group));
      const pieceIntersects = raycaster.intersectObjects(activePieceGroupList, true);

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

      // Check tile clicks
      const allTiles: THREE.Mesh[] = [];
      tileMeshesRef.current.forEach(row => row.forEach(t => allTiles.push(t)));
      const tileIntersects = raycaster.intersectObjects(allTiles);

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

    // Window Resize Observer
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

      // Pulsing glow effect on cyan & gold materials
      cyanGlowMat.emissiveIntensity = 2.0 + Math.sin(elapsedTime * 3.5) * 0.5;
      goldGlowMat.emissiveIntensity = 2.0 + Math.cos(elapsedTime * 3.5) * 0.5;

      // Update piece positions smoothly & render bobbing for selected piece
      piecesRef.current.forEach(piece => {
        const meshGroup = pieceMeshesRef.current.get(piece.id);
        if (!meshGroup) return;

        const targetX = (piece.position.col - 3.5) * squareSize;
        const targetZ = (piece.position.row - 3.5) * squareSize;
        const isSelected = piece.id === selectedPieceIdRef.current;

        const targetY = isSelected ? 0.18 + Math.sin(elapsedTime * 6.0) * 0.05 : 0;

        // Smooth position interpolation (lerp)
        meshGroup.position.x += (targetX - meshGroup.position.x) * 0.25;
        meshGroup.position.z += (targetZ - meshGroup.position.z) * 0.25;
        meshGroup.position.y += (targetY - meshGroup.position.y) * 0.25;

        // Highlight selection ring underneath
        if (isSelected) {
          selectionRingMesh.position.set(meshGroup.position.x, 0.015, meshGroup.position.z);
          selectionRingMesh.visible = true;
          selectionRingMesh.rotation.z = elapsedTime * 1.5;
        }
      });

      if (!selectedPieceIdRef.current) {
        selectionRingMesh.visible = false;
      }

      // Update valid target markers highlight pool
      // Clear previous markers
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
        markerMesh.position.set(tx, 0.01, tz);
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
        ringMesh.position.set(tx, 0.02, tz);
        targetMarkerGroup.add(ringMesh);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup lifecycle on unmount
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

    // 1. Remove captured pieces
    currentPieceMap.forEach((group, id) => {
      if (!activeIds.has(id)) {
        scene.remove(group);
        currentPieceMap.delete(id);
      }
    });

    // 2. Add or Update pieces
    pieces.forEach(piece => {
      const isPlayer1 = piece.playerId === player1Id;
      const bodyMat = isPlayer1 ? bodyDarkMat : bodyGoldDarkMat;
      const glowMat = isPlayer1 ? cyanGlowMat : goldGlowMat;

      let group = currentPieceMap.get(piece.id);

      // Re-create mesh if king status changed or if mesh doesn't exist yet
      if (!group || group.userData.isKing !== piece.isKing) {
        if (group) scene.remove(group);

        group = new THREE.Group();
        group.userData = { pieceId: piece.id, isKing: piece.isKing };

        // Main cylindrical metallic piece body
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

        // Initial position
        const x = (piece.position.col - 3.5) * 1.0;
        const z = (piece.position.row - 3.5) * 1.0;
        group.position.set(x, 0, z);

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
