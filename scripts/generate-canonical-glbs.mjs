import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.cwd(), 'public', 'models');

function createMeshBuilder() {
  const positions = [];
  const normals = [];
  const indices = [];

  function addQuad(v0, v1, v2, v3, normal) {
    const base = positions.length / 3;
    const verts = [v0, v1, v2, v3];
    for (const v of verts) {
      positions.push(v[0], v[1], v[2]);
      normals.push(normal[0], normal[1], normal[2]);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  function addTri(v0, v1, v2) {
    const ux = v1[0] - v0[0];
    const uy = v1[1] - v0[1];
    const uz = v1[2] - v0[2];
    const vx = v2[0] - v0[0];
    const vy = v2[1] - v0[1];
    const vz = v2[2] - v0[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    const base = positions.length / 3;
    for (const v of [v0, v1, v2]) {
      positions.push(v[0], v[1], v[2]);
      normals.push(nx, ny, nz);
    }
    indices.push(base, base + 1, base + 2);
  }

  function addBox(cx, cy, cz, sx, sy, sz) {
    const hx = sx / 2;
    const hy = sy / 2;
    const hz = sz / 2;
    const x0 = cx - hx, x1 = cx + hx;
    const y0 = cy - hy, y1 = cy + hy;
    const z0 = cz - hz, z1 = cz + hz;

    // Front (+Z)
    addQuad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    // Back (-Z)
    addQuad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
    // Right (+X)
    addQuad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
    // Left (-X)
    addQuad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    // Top (+Y)
    addQuad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
    // Bottom (-Y)
    addQuad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
  }

  function addTaperedFrustum(cx, cy, cz, bottomW, topW, h, bottomD = bottomW, topD = topW) {
    const hy = h / 2;
    const bx = bottomW / 2;
    const tx = topW / 2;
    const bz = bottomD / 2;
    const tz = topD / 2;
    const y0 = cy - hy;
    const y1 = cy + hy;

    const b0 = [cx - bx, y0, cz + bz];
    const b1 = [cx + bx, y0, cz + bz];
    const b2 = [cx + bx, y0, cz - bz];
    const b3 = [cx - bx, y0, cz - bz];

    const t0 = [cx - tx, y1, cz + tz];
    const t1 = [cx + tx, y1, cz + tz];
    const t2 = [cx + tx, y1, cz - tz];
    const t3 = [cx - tx, y1, cz - tz];

    const pushFace = (a, b, c, d) => {
      addTri(a, b, c);
      addTri(a, c, d);
    };

    pushFace(b0, b1, t1, t0);
    pushFace(b1, b2, t2, t1);
    pushFace(b2, b3, t3, t2);
    pushFace(b3, b0, t0, t3);
    pushFace(t0, t1, t2, t3);
    pushFace(b3, b2, b1, b0);
  }

  return { addBox, addTaperedFrustum, positions, normals, indices };
}

function encodeGlb(name, builder) {
  const posArr = new Float32Array(builder.positions);
  const normArr = new Float32Array(builder.normals);
  const idxArr = new Uint16Array(builder.indices);

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < posArr.length; i += 3) {
    minX = Math.min(minX, posArr[i]);
    minY = Math.min(minY, posArr[i + 1]);
    minZ = Math.min(minZ, posArr[i + 2]);
    maxX = Math.max(maxX, posArr[i]);
    maxY = Math.max(maxY, posArr[i + 1]);
    maxZ = Math.max(maxZ, posArr[i + 2]);
  }

  const posBytes = Buffer.from(posArr.buffer);
  const normBytes = Buffer.from(normArr.buffer);
  const idxBytes = Buffer.from(idxArr.buffer);
  const idxPadLen = (4 - (idxBytes.length % 4)) % 4;
  const idxPadding = Buffer.alloc(idxPadLen, 0);

  const posOffset = 0;
  const normOffset = posBytes.length;
  const idxOffset = normOffset + normBytes.length;
  const rawBin = Buffer.concat([posBytes, normBytes, idxBytes, idxPadding]);
  const binPadLen = (4 - (rawBin.length % 4)) % 4;
  const binBuffer = binPadLen > 0 ? Buffer.concat([rawBin, Buffer.alloc(binPadLen, 0)]) : rawBin;

  const gltfJson = {
    asset: { version: '2.0', generator: 'tiny-dungeon-glb-builder' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [
      {
        name,
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
          },
        ],
      },
    ],
    buffers: [{ byteLength: binBuffer.length }],
    bufferViews: [
      { buffer: 0, byteOffset: posOffset, byteLength: posBytes.length, target: 34962 },
      { buffer: 0, byteOffset: normOffset, byteLength: normBytes.length, target: 34962 },
      { buffer: 0, byteOffset: idxOffset, byteLength: idxBytes.length, target: 34963 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: posArr.length / 3,
        type: 'VEC3',
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normArr.length / 3,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: idxArr.length,
        type: 'SCALAR',
      },
    ],
  };

  let jsonBytes = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPadLen = (4 - (jsonBytes.length % 4)) % 4;
  if (jsonPadLen > 0) {
    jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadLen, 0x20)]);
  }

  const totalLength = 12 + 8 + jsonBytes.length + 8 + binBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBytes.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuffer.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"

  return Buffer.concat([header, jsonHeader, jsonBytes, binHeader, binBuffer]);
}

function buildToriiGate() {
  const b = createMeshBuilder();
  // Pedestals (Kamebara)
  b.addTaperedFrustum(-0.48, -0.46, 0, 0.3, 0.22, 0.14);
  b.addTaperedFrustum(0.48, -0.46, 0, 0.3, 0.22, 0.14);
  // Pillars (Hashira)
  b.addTaperedFrustum(-0.48, 0.05, 0, 0.18, 0.15, 0.94);
  b.addTaperedFrustum(0.48, 0.05, 0, 0.18, 0.15, 0.94);
  // Lower tie beam (Nuki) with projecting pegs
  b.addBox(0, 0.28, 0, 1.24, 0.09, 0.11);
  // Center tablet (Gakuzuka)
  b.addBox(0, 0.39, 0, 0.16, 0.16, 0.13);
  // Sub-lintel beam (Shimagi)
  b.addBox(0, 0.49, 0, 1.32, 0.09, 0.17);
  // Upper sweeping roof beam (Kasagi)
  b.addTaperedFrustum(0, 0.59, 0, 1.38, 1.54, 0.12, 0.22, 0.28);
  return b;
}

function buildLanternPedestal() {
  const b = createMeshBuilder();
  // Base plinth (Kiso)
  b.addTaperedFrustum(0, -0.26, 0, 0.32, 0.22, 0.1);
  // Shaft (Sao)
  b.addTaperedFrustum(0, -0.11, 0, 0.12, 0.1, 0.22);
  // Firebox tray (Chudai)
  b.addTaperedFrustum(0, 0.02, 0, 0.14, 0.24, 0.06);
  // Corner struts of lantern chamber (Hibukuro)
  b.addBox(-0.08, 0.12, -0.08, 0.035, 0.16, 0.035);
  b.addBox(0.08, 0.12, -0.08, 0.035, 0.16, 0.035);
  b.addBox(-0.08, 0.12, 0.08, 0.035, 0.16, 0.035);
  b.addBox(0.08, 0.12, 0.08, 0.035, 0.16, 0.035);
  // Pagoda Roof (Kasa)
  b.addTaperedFrustum(0, 0.24, 0, 0.32, 0.12, 0.09);
  // Finial (Hoju)
  b.addTaperedFrustum(0, 0.32, 0, 0.09, 0.02, 0.08);
  return b;
}

function buildRelicChest() {
  const b = createMeshBuilder();
  // Base lacquer box
  b.addTaperedFrustum(0, -0.04, 0, 0.42, 0.44, 0.2, 0.3, 0.32);
  // Vaulted bevel lid
  b.addTaperedFrustum(0, 0.12, 0, 0.46, 0.34, 0.12, 0.34, 0.22);
  // Iron/gold corner trim straps
  b.addBox(-0.15, 0.04, 0, 0.05, 0.28, 0.35);
  b.addBox(0.15, 0.04, 0, 0.05, 0.28, 0.35);
  // Front lock clasp
  b.addBox(0, 0.06, 0.18, 0.09, 0.11, 0.04);
  return b;
}

function buildTacticalD6() {
  const b = createMeshBuilder();
  // Core die block
  b.addBox(0, 0, 0, 0.42, 0.42, 0.42);
  // Raised chamfered face frames for crisp specular edges
  b.addTaperedFrustum(0, 0.23, 0, 0.36, 0.28, 0.04);
  b.addTaperedFrustum(0, -0.23, 0, 0.28, 0.36, 0.04);
  b.addBox(0.22, 0, 0, 0.03, 0.32, 0.32);
  b.addBox(-0.22, 0, 0, 0.03, 0.32, 0.32);
  b.addBox(0, 0, 0.22, 0.32, 0.32, 0.03);
  b.addBox(0, 0, -0.22, 0.32, 0.32, 0.03);
  return b;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const specs = [
    ['torii-gate', buildToriiGate()],
    ['lantern-pedestal', buildLanternPedestal()],
    ['relic-chest', buildRelicChest()],
    ['tactical-d6', buildTacticalD6()],
  ];

  for (const [id, mesh] of specs) {
    const outPath = path.join(OUT_DIR, `${id}.glb`);
    const glb = encodeGlb(id, mesh);
    fs.writeFileSync(outPath, glb);
    console.log(`Generated ${outPath} (${glb.length} bytes, ${mesh.indices.length / 3} tris)`);
  }
}

main();
