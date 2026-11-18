import { useEffect, useState } from 'react';
import * as THREE from 'three';

export const GLB_MODEL_IDS = [
  'torii-gate',
  'lantern-pedestal',
  'relic-chest',
  'tactical-d6',
] as const;

export type GlbModelId = (typeof GLB_MODEL_IDS)[number];

export const GLB_MODEL_PATHS: Record<GlbModelId, string> = {
  'torii-gate': '/models/torii-gate.glb',
  'lantern-pedestal': '/models/lantern-pedestal.glb',
  'relic-chest': '/models/relic-chest.glb',
  'tactical-d6': '/models/tactical-d6.glb',
};

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

const geometryCache = new Map<GlbModelId, THREE.BufferGeometry>();
const pendingLoads = new Map<GlbModelId, Promise<THREE.BufferGeometry | null>>();

interface GltfJson {
  meshes?: Array<{
    primitives?: Array<{
      attributes?: Record<string, number>;
      indices?: number;
    }>;
  }>;
  accessors?: Array<{
    bufferView?: number;
    byteOffset?: number;
    componentType: number;
    count: number;
    type: string;
  }>;
  bufferViews?: Array<{
    buffer: number;
    byteOffset?: number;
    byteLength: number;
  }>;
}

function readTypedSlice(
  binChunk: ArrayBuffer,
  binBaseOffset: number,
  gltf: GltfJson,
  accessorIndex: number,
  componentsPerElement: number
): Float32Array | Uint16Array | Uint32Array | null {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor || accessor.bufferView === undefined) return null;
  const view = gltf.bufferViews?.[accessor.bufferView];
  if (!view) return null;

  const byteOffset = binBaseOffset + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const totalElements = accessor.count * componentsPerElement;

  if (accessor.componentType === 5126) {
    // FLOAT32
    const bytes = new Uint8Array(binChunk, byteOffset, totalElements * 4);
    const aligned = new Uint8Array(totalElements * 4);
    aligned.set(bytes);
    return new Float32Array(aligned.buffer);
  }
  if (accessor.componentType === 5123) {
    // UNSIGNED_SHORT
    const bytes = new Uint8Array(binChunk, byteOffset, totalElements * 2);
    const aligned = new Uint8Array(totalElements * 2);
    aligned.set(bytes);
    return new Uint16Array(aligned.buffer);
  }
  if (accessor.componentType === 5125) {
    // UNSIGNED_INT
    const bytes = new Uint8Array(binChunk, byteOffset, totalElements * 4);
    const aligned = new Uint8Array(totalElements * 4);
    aligned.set(bytes);
    return new Uint32Array(aligned.buffer);
  }
  return null;
}

/**
 * Parses a standard binary glTF 2.0 (.glb) ArrayBuffer into a Three.js BufferGeometry.
 * Returns null safely on malformed input instead of throwing into the R3F render tree.
 */
export function parseGlbToGeometry(buffer: ArrayBuffer): THREE.BufferGeometry | null {
  try {
    if (!buffer || buffer.byteLength < 20) return null;
    const view = new DataView(buffer);
    const magic = view.getUint32(0, true);
    const version = view.getUint32(4, true);
    if (magic !== GLB_MAGIC || version !== 2) return null;

    let offset = 12;
    let gltf: GltfJson | null = null;
    let binOffset = -1;
    let binLength = 0;

    while (offset + 8 <= buffer.byteLength) {
      const chunkLen = view.getUint32(offset, true);
      const chunkType = view.getUint32(offset + 4, true);
      const dataStart = offset + 8;
      if (dataStart + chunkLen > buffer.byteLength) break;

      if (chunkType === CHUNK_JSON) {
        const jsonBytes = new Uint8Array(buffer, dataStart, chunkLen);
        const jsonText = new TextDecoder('utf-8').decode(jsonBytes).trim();
        gltf = JSON.parse(jsonText) as GltfJson;
      } else if (chunkType === CHUNK_BIN) {
        binOffset = dataStart;
        binLength = chunkLen;
      }

      offset = dataStart + chunkLen;
    }

    if (!gltf || binOffset < 0 || binLength === 0) return null;

    const primitive = gltf.meshes?.[0]?.primitives?.[0];
    if (!primitive?.attributes || primitive.attributes.POSITION === undefined) {
      return null;
    }

    const posData = readTypedSlice(
      buffer,
      binOffset,
      gltf,
      primitive.attributes.POSITION,
      3
    );
    if (!(posData instanceof Float32Array)) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posData, 3));

    if (primitive.attributes.NORMAL !== undefined) {
      const normData = readTypedSlice(
        buffer,
        binOffset,
        gltf,
        primitive.attributes.NORMAL,
        3
      );
      if (normData instanceof Float32Array) {
        geometry.setAttribute('normal', new THREE.BufferAttribute(normData, 3));
      } else {
        geometry.computeVertexNormals();
      }
    } else {
      geometry.computeVertexNormals();
    }

    if (primitive.indices !== undefined) {
      const idxData = readTypedSlice(buffer, binOffset, gltf, primitive.indices, 1);
      if (idxData instanceof Uint16Array || idxData instanceof Uint32Array) {
        geometry.setIndex(new THREE.BufferAttribute(idxData, 1));
      }
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  } catch {
    return null;
  }
}

async function fetchGlbGeometry(id: GlbModelId): Promise<THREE.BufferGeometry | null> {
  const existing = geometryCache.get(id);
  if (existing) return existing;

  const inflight = pendingLoads.get(id);
  if (inflight) return inflight;

  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return null;
  }

  const promise = (async () => {
    try {
      const response = await fetch(GLB_MODEL_PATHS[id]);
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      const geom = parseGlbToGeometry(buffer);
      if (geom) geometryCache.set(id, geom);
      return geom;
    } catch {
      return null;
    } finally {
      pendingLoads.delete(id);
    }
  })();

  pendingLoads.set(id, promise);
  return promise;
}

/**
 * Loads and caches a canonical .glb model geometry asynchronously,
 * returning null in headless/JSDOM environments or while loading so procedural meshes remain intact.
 */
export function useGlbGeometry(id: GlbModelId): THREE.BufferGeometry | null {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(
    () => geometryCache.get(id) ?? null
  );

  useEffect(() => {
    const cached = geometryCache.get(id);
    if (cached) {
      setGeometry(cached);
      return;
    }
    let active = true;
    void fetchGlbGeometry(id).then((loaded) => {
      if (active && loaded) {
        setGeometry(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  return geometry;
}
