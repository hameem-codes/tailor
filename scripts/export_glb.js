import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node
globalThis.FileReader = class {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onloadend = null;
    this.onerror = null;
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }).catch((err) => {
      if (this.onerror) this.onerror(err);
    });
  }
};

async function exportGLB() {
  const objPath = path.resolve('public/models/tailored_jacket.obj');
  const objText = fs.readFileSync(objPath, 'utf-8');

  const loader = new OBJLoader();
  const obj = loader.parse(objText);

  // Compute bounding box and center
  const box = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box.getCenter(center);
  obj.position.sub(center);

  const frontMat = new THREE.MeshStandardMaterial({
    name: 'JacketFrontMaterial',
    color: 0x1f232b,
    roughness: 0.82,
    metalness: 0.15,
    side: THREE.DoubleSide
  });

  obj.traverse((child) => {
    if (child.isMesh) {
      child.geometry.computeVertexNormals();
      child.material = frontMat;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const exporter = new GLTFExporter();
  exporter.parse(
    obj,
    (glbBuffer) => {
      const outputPath = path.resolve('public/models/tailored_jacket.glb');
      fs.writeFileSync(outputPath, Buffer.from(glbBuffer));
      console.log(`Exported GLB successfully: ${outputPath} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
    },
    (err) => {
      console.error('GLTF export error:', err);
    },
    { binary: true }
  );
}

exportGLB().catch(console.error);
