import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  GLB_MODEL_IDS,
  GLB_MODEL_PATHS,
  parseGlbToGeometry,
} from '../../src/components/canvas/glbRegistry';

describe('glbRegistry & canonical .glb assets', () => {
  it('parses all 4 generated .glb files in public/models/ into valid BufferGeometries', () => {
    const publicRoot = path.resolve(process.cwd(), 'public');

    for (const id of GLB_MODEL_IDS) {
      const relPath = GLB_MODEL_PATHS[id].replace(/^\//, '');
      const fullPath = path.join(publicRoot, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);

      const nodeBuf = fs.readFileSync(fullPath);
      const arrayBuffer = nodeBuf.buffer.slice(
        nodeBuf.byteOffset,
        nodeBuf.byteOffset + nodeBuf.byteLength
      );

      const geometry = parseGlbToGeometry(arrayBuffer);
      expect(geometry).not.toBeNull();
      const posAttr = geometry!.getAttribute('position');
      const normAttr = geometry!.getAttribute('normal');
      const indexAttr = geometry!.getIndex();

      expect(posAttr).toBeDefined();
      expect(posAttr.count).toBeGreaterThanOrEqual(24);
      expect(normAttr).toBeDefined();
      expect(normAttr.count).toBe(posAttr.count);
      expect(indexAttr).not.toBeNull();
      expect(indexAttr!.count).toBeGreaterThanOrEqual(36);
      expect(geometry!.boundingBox).not.toBeNull();
    }
  });

  it('safely returns null on invalid or truncated binary buffers', () => {
    expect(parseGlbToGeometry(new ArrayBuffer(8))).toBeNull();
    const junk = new Uint8Array(64);
    expect(parseGlbToGeometry(junk.buffer)).toBeNull();
  });
});
