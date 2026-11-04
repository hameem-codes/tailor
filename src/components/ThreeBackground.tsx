import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { UnitSystem } from '../types';

interface ThreeBackgroundProps {
  category?: string;
  unit?: UnitSystem;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  category: _category = 't-shirt',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Detect current active tab / screen:
  // Tab 1: Input / Landing ('/')
  // Tab 2: Results / Loading ('/results', '/loading')
  // Tab 3: Brand Detail ('/brand/:id')
  const currentTab = location.pathname.startsWith('/brand/')
    ? 3
    : location.pathname === '/results' || location.pathname === '/loading'
      ? 2
      : 1;

  // Use a ref to feed current tab to the 60fps Three.js animation loop without recreating the scene
  const currentTabRef = useRef(currentTab);
  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0b, 0.038);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Main 3D Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 3. Studio Lighting (Crisp Studio Lighting - Pure White Key, Moonlit Rim Highlights, Zero Green)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const whiteKeyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    whiteKeyLight.position.set(3.5, 4.0, 3.5);
    scene.add(whiteKeyLight);

    const platinumFillLight = new THREE.PointLight(0xe2e8f0, 2.2, 16);
    platinumFillLight.position.set(-3.5, -0.5, 3.0);
    scene.add(platinumFillLight);

    // Strong Moonlit Silver Rim Lights from back & sides to trace garment silhouettes crisply
    const silverRimLight = new THREE.PointLight(0xffffff, 3.0, 16);
    silverRimLight.position.set(0, 2.0, -3.2);
    scene.add(silverRimLight);

    const leftRimLight = new THREE.PointLight(0xe2e8f0, 2.6, 14);
    leftRimLight.position.set(-3.5, 0.5, -1.0);
    scene.add(leftRimLight);

    const overheadSpot = new THREE.SpotLight(0xffffff, 1.8, 14, Math.PI / 4, 0.4);
    overheadSpot.position.set(0, 5.5, 2.0);
    overheadSpot.target.position.set(0, 0, 0);
    scene.add(overheadSpot);
    scene.add(overheadSpot.target);

    // 4. Textures
    const textureLoader = new THREE.TextureLoader();
    const diffuseTexture = textureLoader.load(
      '/apparel/hoodie_hero_diffuse.png',
      () => renderer.render(scene, camera)
    );
    diffuseTexture.colorSpace = THREE.SRGBColorSpace;
    diffuseTexture.minFilter = THREE.LinearMipmapLinearFilter;
    diffuseTexture.magFilter = THREE.LinearFilter;

    const normalTexture = textureLoader.load('/apparel/hoodie_hero_normal.png');
    normalTexture.minFilter = THREE.LinearMipmapLinearFilter;
    normalTexture.magFilter = THREE.LinearFilter;

    // 5. Materials (Distinct, Highly Visible Studio Colorway - NO GREEN)
    // Center Hero Hoodie: Sculptural Studio Heather Silver (#d8dfe8) -> Bright, detailed, and 100% visible!
    const heroMaterial = new THREE.MeshStandardMaterial({
      map: diffuseTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.82,
      metalness: 0.08,
      color: 0xd8dfe8, // Bright Studio Heather Silver / Moonlit Platinum
      side: THREE.FrontSide,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: true,
    });

    // Left Companion Hoodie: Warm Desert Sand / Earth Taupe (#c8b6a6)
    const leftCompanionMaterial = new THREE.MeshStandardMaterial({
      map: diffuseTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.86,
      metalness: 0.05,
      color: 0xc8b6a6, // Warm Desert Sand
      side: THREE.FrontSide,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: true,
    });

    // Right Companion Hoodie: Smoked Titanium / Slate (#b4bcc8)
    const rightCompanionMaterial = new THREE.MeshStandardMaterial({
      map: diffuseTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.84,
      metalness: 0.12,
      color: 0xb4bcc8, // Platinum Titanium
      side: THREE.FrontSide,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: true,
    });

    // 6. Smooth Volumetric 3D Hoodie Geometry (Parametric - Zero Stair-Step Artifacts)
    function createSmoothHoodieGeometry(width = 2.1, height = 2.7, segX = 56, segY = 64) {
      const geo = new THREE.PlaneGeometry(width, height, segX, segY);
      const pos = geo.attributes.position;
      const count = pos.count;

      for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const nx = x / (width * 0.5); // -1 to 1 across garment width
        const ny = y / (height * 0.5); // -1 to 1 across garment height

        // 1. Torso cylindrical & anatomical curvature
        const torsoZ = Math.cos(nx * Math.PI * 0.44) * 0.36;

        // 2. Puffy drop shoulders and forward-curved sleeves
        const isSleeve = Math.abs(nx) > 0.4 && ny < 0.35;
        const sleeveCurve = isSleeve ? Math.sin((Math.abs(nx) - 0.4) * 2.6) * 0.26 : 0;

        // 3. Deep 3D open hood volume at the top (ny > 0.35)
        let hoodZ = 0;
        if (ny > 0.35) {
          const hoodFactor = (ny - 0.35) / 0.65;
          const hoodArc = Math.cos(nx * Math.PI * 0.72);
          hoodZ = hoodArc * 0.38 * hoodFactor;
        }

        // 4. Subtle chest volume & hem taper
        const chestZ = Math.exp(-(nx * nx * 3.2 + (ny - 0.08) * (ny - 0.08) * 4.2)) * 0.14;

        pos.setZ(i, torsoZ + sleeveCurve + hoodZ + chestZ);
      }

      geo.computeVertexNormals();
      return geo;
    }

    const baseHoodieGeo = createSmoothHoodieGeometry();
    const originalPositions = new Float32Array(baseHoodieGeo.attributes.position.array);

    // 7. Streetwear Hoodie Trio Group
    const hoodieTrioGroup = new THREE.Group();
    rootGroup.add(hoodieTrioGroup);

    // Center Hero Hoodie (Chalk White, front-facing)
    const centerHoodieMesh = new THREE.Mesh(baseHoodieGeo, heroMaterial);
    centerHoodieMesh.position.set(0, 0, 0);
    hoodieTrioGroup.add(centerHoodieMesh);

    // Left Companion Hoodie (Warm Bone Ivory, angled back in showroom depth)
    const leftHoodieMesh = new THREE.Mesh(baseHoodieGeo.clone(), leftCompanionMaterial);
    leftHoodieMesh.position.set(-2.5, -0.08, -0.9);
    leftHoodieMesh.rotation.y = 0.46;
    leftHoodieMesh.scale.set(0.88, 0.88, 0.88);
    hoodieTrioGroup.add(leftHoodieMesh);

    // Right Companion Hoodie (Platinum Silver, angled back in showroom depth)
    const rightHoodieMesh = new THREE.Mesh(baseHoodieGeo.clone(), rightCompanionMaterial);
    rightHoodieMesh.position.set(2.5, -0.08, -0.9);
    rightHoodieMesh.rotation.y = -0.46;
    rightHoodieMesh.scale.set(0.88, 0.88, 0.88);
    hoodieTrioGroup.add(rightHoodieMesh);

    // 8. Floating Couture Measuring Ribbon (Pure Silver-White Satin - ZERO GREEN)
    const tapePoints: THREE.Vector3[] = [];
    const turns = 2.4;
    const tapeSegments = 100;
    for (let i = 0; i <= tapeSegments; i++) {
      const t = i / tapeSegments;
      const angle = t * Math.PI * 2 * turns + Math.PI * 0.35;
      const y = THREE.MathUtils.lerp(1.8, -1.4, t);
      const r = THREE.MathUtils.lerp(2.4, 2.0, t) + Math.sin(t * Math.PI * 4) * 0.16;
      tapePoints.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const tapeCurve = new THREE.CatmullRomCurve3(tapePoints);
    const tapeGeometry = new THREE.TubeGeometry(tapeCurve, 80, 0.024, 8, false);
    const tapeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xffffff,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.65,
      transparent: true,
      opacity: 0.72,
    });
    const tapeMesh = new THREE.Mesh(tapeGeometry, tapeMaterial);
    rootGroup.add(tapeMesh);

    // 9. Floating Platinum Stardust Particles (ZERO GREEN)
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      particleSpeeds[i] = 0.15 + Math.random() * 0.45;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf1f5f9,
      size: 0.038,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 10. Mouse Interaction
    let mouseYaw = 0;
    let mousePitch = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseYaw = mouseX * 0.32;
      mousePitch = -mouseY * 0.14;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 11. Tab Adaptation Parameters & Smooth Lerp Targets
    // Vectors for smooth interpolation between tabs
    const targetGroupPos = new THREE.Vector3();
    const targetGroupScale = new THREE.Vector3();
    const targetLeftPos = new THREE.Vector3();
    const targetRightPos = new THREE.Vector3();
    let targetBaseRotationY = 0;

    // Helper to calculate responsive target transformations for the current tab
    function updateTabTargets(tab: number) {
      const isDesktop = window.innerWidth >= 1024;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      if (tab === 1) {
        // TAB 1: Input / Landing ('/')
        // Make model ENLARGED and fit the left hero space prominently so user sees it clearly!
        if (isDesktop) {
          targetGroupPos.set(-0.95, 0.05, 0.1);
          targetGroupScale.set(2.25, 2.25, 2.25);
          targetBaseRotationY = 0.12;
          targetLeftPos.set(-2.4, -0.08, -0.9);
          targetRightPos.set(2.4, -0.08, -0.9);
        } else if (isTablet) {
          targetGroupPos.set(-0.6, 0.1, -0.2);
          targetGroupScale.set(1.85, 1.85, 1.85);
          targetBaseRotationY = 0.08;
          targetLeftPos.set(-2.2, -0.08, -0.9);
          targetRightPos.set(2.2, -0.08, -0.9);
        } else {
          // Mobile: Centered, elevated above fold
          targetGroupPos.set(0, 0.45, -0.4);
          targetGroupScale.set(1.45, 1.45, 1.45);
          targetBaseRotationY = 0;
          targetLeftPos.set(-2.0, -0.08, -0.9);
          targetRightPos.set(2.0, -0.08, -0.9);
        }
      } else if (tab === 2) {
        // TAB 2: Results / Loading ('/results', '/loading')
        // Enlarge into an expansive, panoramic fashion showroom behind the brand cards!
        if (isDesktop) {
          targetGroupPos.set(0, 0.12, -0.8);
          targetGroupScale.set(2.5, 2.5, 2.5);
          targetBaseRotationY = 0;
          targetLeftPos.set(-3.0, -0.08, -1.1);
          targetRightPos.set(3.0, -0.08, -1.1);
        } else {
          targetGroupPos.set(0, 0.2, -1.2);
          targetGroupScale.set(1.7, 1.7, 1.7);
          targetBaseRotationY = 0;
          targetLeftPos.set(-2.3, -0.08, -1.0);
          targetRightPos.set(2.3, -0.08, -1.0);
        }
      } else {
        // TAB 3: Brand Detail ('/brand/:id')
        // Fashion showroom mannequin perspective positioned elegantly behind the cards
        if (isDesktop) {
          targetGroupPos.set(-0.6, 0.08, -0.45);
          targetGroupScale.set(2.15, 2.15, 2.15);
          targetBaseRotationY = 0.18; // Angled gracefully towards chart
          targetLeftPos.set(-2.8, -0.08, -1.0);
          targetRightPos.set(2.8, -0.08, -1.0);
        } else {
          targetGroupPos.set(0, 0.35, -0.7);
          targetGroupScale.set(1.5, 1.5, 1.5);
          targetBaseRotationY = 0.12;
          targetLeftPos.set(-2.2, -0.08, -1.0);
          targetRightPos.set(2.2, -0.08, -1.0);
        }
      }
    }

    // Initialize targets immediately
    updateTabTargets(currentTabRef.current);
    rootGroup.position.copy(targetGroupPos);
    rootGroup.scale.copy(targetGroupScale);

    // 12. Animation Loop (Smooth Inter-Tab Lerp + Cloth Breathing)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const motionSpeed = prefersReducedMotion ? 0.1 : 1.0;

      // Update target based on live currentTab
      updateTabTargets(currentTabRef.current);

      // Smooth buttery-smooth lerp interpolation between tabs (0.045 factor = ~0.8s graceful glide)
      rootGroup.position.lerp(targetGroupPos, 0.045);
      rootGroup.scale.lerp(targetGroupScale, 0.045);

      leftHoodieMesh.position.lerp(targetLeftPos, 0.045);
      rightHoodieMesh.position.lerp(targetRightPos, 0.045);

      // Subtle idle turntable drift + mouse parallax
      const idleYaw = Math.sin(elapsed * 0.35 * motionSpeed) * 0.08;
      const desiredYaw = targetBaseRotationY + mouseYaw + idleYaw;
      rootGroup.rotation.y = THREE.MathUtils.lerp(rootGroup.rotation.y, desiredYaw, 0.045);
      rootGroup.rotation.x = THREE.MathUtils.lerp(rootGroup.rotation.x, mousePitch, 0.045);

      // Harmonic Floating & Breathing motion (bobbing)
      centerHoodieMesh.position.y = Math.sin(elapsed * 1.3 * motionSpeed) * 0.06;
      leftHoodieMesh.position.y = targetLeftPos.y + Math.sin((elapsed * 1.3 + 0.8) * motionSpeed) * 0.05;
      rightHoodieMesh.position.y = targetRightPos.y + Math.sin((elapsed * 1.3 - 0.8) * motionSpeed) * 0.05;

      // Smooth Continuous Cloth Breathing Wave on Center Hoodie
      if (centerHoodieMesh && originalPositions) {
        const positions = centerHoodieMesh.geometry.attributes.position;
        const count = positions.count;

        for (let i = 0; i < count; i++) {
          const origX = originalPositions[i * 3];
          const origY = originalPositions[i * 3 + 1];
          const origZ = originalPositions[i * 3 + 2];

          // Harmonic micro-flutter along cotton drape
          const wave = Math.sin(elapsed * 2.2 * motionSpeed + origY * 3.5 + origX * 2.0) * 0.007;
          const chestBreath = Math.sin(elapsed * 1.3 * motionSpeed) * 0.012 * (origY > -0.2 ? 1.0 : 0.4);

          positions.setZ(i, origZ + wave + chestBreath);
        }
        positions.needsUpdate = true;
        centerHoodieMesh.geometry.computeVertexNormals();
      }

      // Measuring ribbon rotation & pulse
      tapeMesh.rotation.y = elapsed * 0.12 * motionSpeed;
      tapeMaterial.emissiveIntensity = 0.32 + Math.sin(elapsed * 2.0 * motionSpeed) * 0.14;

      // Drift floating stardust particles upward
      const pPositions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3 + 1] += particleSpeeds[i] * delta * motionSpeed;
        if (pPositions[i * 3 + 1] > 5) {
          pPositions[i * 3 + 1] = -5;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 13. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      baseHoodieGeo.dispose();
      heroMaterial.dispose();
      leftCompanionMaterial.dispose();
      rightCompanionMaterial.dispose();
      diffuseTexture.dispose();
      normalTexture.dispose();
      tapeGeometry.dispose();
      tapeMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    />
  );
};
