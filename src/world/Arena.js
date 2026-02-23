import * as THREE from 'three';

const ARENA_RADIUS = 15;
const PLATFORM_HEIGHT = 0.2;

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this._buildPlatform();
    this._buildEdge();
    this._buildCover();
    this._buildSkybox();
    this._buildLighting();
    this._buildStarfield();
  }

  _buildPlatform() {
    // Main floor
    const floorGeo = new THREE.CircleGeometry(ARENA_RADIUS, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d4a5c,
      metalness: 0.3,
      roughness: 0.5,
      emissive: 0x0a1020,
      emissiveIntensity: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Grid lines
    const gridGeo = new THREE.CircleGeometry(ARENA_RADIUS, 64);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x30a0e0,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.01;
    this.group.add(grid);

    // Radial grid
    for (let r = 5; r <= ARENA_RADIUS; r += 5) {
      const ringGeo = new THREE.RingGeometry(r - 0.02, r + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x30a0e0,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      this.group.add(ring);
    }
  }

  _buildEdge() {
    // Glowing edge ring
    const edgeGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.08, 8, 128);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 1.0,
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.05;
    this.group.add(edge);

    // Outer glow
    const glowGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.3, 8, 128);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.35,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.05;
    this.group.add(glow);

    // Vertical energy wall (subtle)
    const wallGeo = new THREE.CylinderGeometry(ARENA_RADIUS + 0.1, ARENA_RADIUS + 0.1, 3, 64, 1, true);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 1.5;
    this.group.add(wall);
  }

  _buildCover() {
    // 8 cover positions around the arena
    const coverPositions = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 8 + (i % 2) * 3;
      coverPositions.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        rotY: angle + Math.PI / 2,
      });
    }

    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      metalness: 0.5,
      roughness: 0.4,
      emissive: 0x182840,
      emissiveIntensity: 0.5,
    });

    this.coverObjects = [];

    coverPositions.forEach((pos, i) => {
      let geo;
      if (i % 3 === 0) {
        // Tall pillar
        geo = new THREE.CylinderGeometry(0.4, 0.5, 2, 6);
        this.coverObjects.push({ type: 'cylinder', x: pos.x, z: pos.z, radius: 0.5, maxY: 2 });
      } else if (i % 3 === 1) {
        // Low wall (2 wide, 0.4 deep)
        geo = new THREE.BoxGeometry(2, 1.2, 0.4);
        this.coverObjects.push({
          type: 'box', x: pos.x, z: pos.z, hw: 1.0, hd: 0.2,
          cosR: Math.cos(pos.rotY), sinR: Math.sin(pos.rotY), maxY: 1.2,
        });
      } else {
        // Crate (1×1)
        geo = new THREE.BoxGeometry(1, 1, 1);
        this.coverObjects.push({
          type: 'box', x: pos.x, z: pos.z, hw: 0.5, hd: 0.5,
          cosR: Math.cos(pos.rotY), sinR: Math.sin(pos.rotY), maxY: 1.0,
        });
      }

      const cover = new THREE.Mesh(geo, coverMat.clone());
      cover.position.set(pos.x, geo.parameters?.height ? geo.parameters.height / 2 : 0.6, pos.z);
      cover.rotation.y = pos.rotY;
      cover.castShadow = true;
      cover.receiveShadow = true;

      // Edge glow accent
      const edgesGeo = new THREE.EdgesGeometry(geo);
      const edgesMat = new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.6 });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      cover.add(edges);

      this.group.add(cover);
    });
  }

  _buildSkybox() {
    // Dark space gradient sphere
    const skyGeo = new THREE.SphereGeometry(200, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 bottom = vec3(0.005, 0.005, 0.02);
          vec3 top = vec3(0.0, 0.0, 0.005);
          vec3 col = mix(bottom, top, smoothstep(-0.2, 0.5, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  _buildStarfield() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random point on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 40;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.7;
      // Slight color variation
      const tint = Math.random();
      if (tint > 0.9) {
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness * 0.7;
        colors[i * 3 + 2] = brightness * 0.5;
      } else if (tint > 0.8) {
        colors[i * 3] = brightness * 0.5;
        colors[i * 3 + 1] = brightness * 0.7;
        colors[i * 3 + 2] = brightness;
      } else {
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(geo, mat);
    this.scene.add(stars);
  }

  _buildLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x445566, 0.7);
    this.scene.add(ambient);

    // Main directional light (moonlight feel)
    const dirLight = new THREE.DirectionalLight(0x6688cc, 1.0);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);

    // Rim light from below
    const rimLight = new THREE.DirectionalLight(0x0088ff, 0.4);
    rimLight.position.set(0, -5, 0);
    this.scene.add(rimLight);

    // Center platform glow
    const centerLight = new THREE.PointLight(0x00aaff, 1.2, 30);
    centerLight.position.set(0, 1, 0);
    this.group.add(centerLight);
  }

  update(dt) {
    // Could animate edge glow etc. here
  }
}
