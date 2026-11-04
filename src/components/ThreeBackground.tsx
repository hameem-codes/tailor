import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { UnitSystem } from '../types';

interface ThreeBackgroundProps {
  category?: string;
  unit?: UnitSystem;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  category = 't-shirt',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0b, 0.045);

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
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Main 3D Root Group
    const rootGroup = new THREE.Group();
    const isDesktop = window.innerWidth >= 1024;
    // Position comfortably behind the left hero on desktop, or centered on mobile
    rootGroup.position.set(isDesktop ? -2.3 : 0, -0.3, isDesktop ? -0.8 : -1.4);
    if (!isDesktop) {
      rootGroup.scale.set(0.85, 0.85, 0.85);
    }
    scene.add(rootGroup);

    // 2. Lighting (Atelier spotlight vibe)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Emerald Green Accent Light from bottom/left
    const greenPointLight = new THREE.PointLight(0x4ade80, 2.5, 16);
    greenPointLight.position.set(-3.5, -1.0, 3);
    scene.add(greenPointLight);

    // Soft White Key Light from top/right
    const whitePointLight = new THREE.PointLight(0xffffff, 1.8, 16);
    whitePointLight.position.set(3, 4, 3.5);
    scene.add(whitePointLight);

    // Subtle Cyan/Teal fill light from back
    const backLight = new THREE.PointLight(0x1da84a, 1.2, 14);
    backLight.position.set(0, 1, -3);
    scene.add(backLight);

    // 3. Procedural 3D Atelier Tailor Mannequin (Dressmaker's Dummy)
    // Points defining the classic couture dressmaker dummy
    const mannequinPoints: THREE.Vector2[] = [];
    mannequinPoints.push(new THREE.Vector2(0.01, 1.95));  // Neck top
    mannequinPoints.push(new THREE.Vector2(0.32, 1.90));  // Neck base
    mannequinPoints.push(new THREE.Vector2(0.82, 1.72));  // Shoulder inner
    mannequinPoints.push(new THREE.Vector2(1.35, 1.50));  // Shoulder outer
    mannequinPoints.push(new THREE.Vector2(1.26, 1.25));  // Armpit / upper chest
    mannequinPoints.push(new THREE.Vector2(1.22, 0.90));  // Bust apex
    mannequinPoints.push(new THREE.Vector2(1.10, 0.50));  // Ribcage
    mannequinPoints.push(new THREE.Vector2(0.90, 0.10));  // Tapered waist
    mannequinPoints.push(new THREE.Vector2(1.04, -0.30)); // Upper hip
    mannequinPoints.push(new THREE.Vector2(1.18, -0.70)); // Full hip curve
    mannequinPoints.push(new THREE.Vector2(1.12, -1.05)); // Torso base rim
    mannequinPoints.push(new THREE.Vector2(0.10, -1.10)); // Bottom plate
    mannequinPoints.push(new THREE.Vector2(0.01, -1.10));

    const latheGeometry = new THREE.LatheGeometry(mannequinPoints, 36);

    // Dark glass / obsidian translucent finish
    const mannequinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111317,
      metalness: 0.9,
      roughness: 0.22,
      transmission: 0.7,
      thickness: 1.4,
      transparent: true,
      opacity: 0.55,
      reflectivity: 0.95,
      clearcoat: 0.4,
    });
    const mannequinMesh = new THREE.Mesh(latheGeometry, mannequinMaterial);
    rootGroup.add(mannequinMesh);

    // Subtle Emerald Wireframe Contour Overlay (Fashion CAD / Precision Tailoring vibe)
    const wireframeGeometry = new THREE.WireframeGeometry(latheGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });
    const wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    rootGroup.add(wireframeMesh);

    // Stand Rod (Brushed Gunmetal / Chrome)
    const poleGeometry = new THREE.CylinderGeometry(0.038, 0.038, 2.4, 20);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x33373e,
      metalness: 0.95,
      roughness: 0.15,
    });
    const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.set(0, -1.9, 0);
    rootGroup.add(poleMesh);

    // Pedestal Base (Circular beveled disk)
    const baseGeometry = new THREE.CylinderGeometry(0.65, 0.75, 0.07, 36);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1e22,
      metalness: 0.8,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(0, -3.05, 0);
    rootGroup.add(baseMesh);

    // Neck Finial (Sleek dark titanium cap with subtle emerald top ring)
    const finialGeometry = new THREE.CylinderGeometry(0.18, 0.26, 0.22, 28);
    const finialMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2228,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x1da84a,
      emissiveIntensity: 0.2,
    });
    const finialMesh = new THREE.Mesh(finialGeometry, finialMaterial);
    finialMesh.position.set(0, 2.05, 0);
    rootGroup.add(finialMesh);

    // 4. Floating Tailor's Tape / Measuring Ribbon Curving Around Torso
    const tapePoints: THREE.Vector3[] = [];
    const turns = 2.4;
    const tapeSegments = 120;
    for (let i = 0; i <= tapeSegments; i++) {
      const t = i / tapeSegments;
      const angle = t * Math.PI * 2 * turns + Math.PI * 0.4;
      const y = THREE.MathUtils.lerp(1.35, -0.65, t);
      const r = THREE.MathUtils.lerp(1.44, 1.26, t) + Math.sin(t * Math.PI * 4) * 0.12;
      tapePoints.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const tapeCurve = new THREE.CatmullRomCurve3(tapePoints);
    const tapeGeometry = new THREE.TubeGeometry(tapeCurve, 100, 0.024, 8, false);
    const tapeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x1da84a,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const tapeMesh = new THREE.Mesh(tapeGeometry, tapeMaterial);
    rootGroup.add(tapeMesh);

    // 5. Floating Silk Ribbon / Fluid Fabric Wave
    // A graceful ribbon undulating in 3D space like couture silk
    const ribbonPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 40; i++) {
      const u = (i / 40) * Math.PI * 2 * 1.5;
      ribbonPoints.push(
        new THREE.Vector3(
          Math.sin(u) * 2.8,
          Math.cos(u * 0.7) * 2.2 - 0.2,
          Math.cos(u) * 2.0 - 0.5
        )
      );
    }
    const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPoints, true);
    const ribbonGeometry = new THREE.TubeGeometry(ribbonCurve, 80, 0.06, 6, true);
    const ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1da84a,
      emissive: 0x093016,
      emissiveIntensity: 0.3,
      metalness: 0.85,
      roughness: 0.2,
      transmission: 0.5,
      transparent: true,
      opacity: 0.4,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    rootGroup.add(ribbonMesh);

    // 6. Floating Tailor Particles (Floating Atelier Stardust / Lint)
    const particleCount = 140;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      particleSpeeds[i] = 0.2 + Math.random() * 0.6;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x4ade80,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 7. Mouse Interaction & Responsive Parallax
    let targetRotationY = 0;
    let targetRotationX = 0;
    let targetPositionX = isDesktop ? -1.8 : 0;

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotationY = mouseX * 0.45;
      targetRotationX = -mouseY * 0.2;
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

      const desktopNow = window.innerWidth >= 1024;
      targetPositionX = desktopNow ? -1.8 : 0;
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth idle rotation + mouse parallax
      const motionSpeed = prefersReducedMotion ? 0.1 : 1.0;
      const idleRotation = elapsed * 0.22 * motionSpeed;

      rootGroup.rotation.y += (targetRotationY + idleRotation - rootGroup.rotation.y) * 0.035;
      rootGroup.rotation.x += (targetRotationX - rootGroup.rotation.x) * 0.035;
      rootGroup.position.x += (targetPositionX - rootGroup.position.x) * 0.05;

      // Subtle breathing float on mannequin
      rootGroup.position.y = -0.2 + Math.sin(elapsed * 1.2 * motionSpeed) * 0.08;

      // Smooth floating rotation of the silk ribbon
      ribbonMesh.rotation.y = elapsed * 0.18 * motionSpeed;
      ribbonMesh.rotation.z = Math.sin(elapsed * 0.4 * motionSpeed) * 0.15;

      // Gentle pulse on the measuring tape glow
      tapeMaterial.emissiveIntensity = 0.5 + Math.sin(elapsed * 2.5 * motionSpeed) * 0.25;

      // Drift floating particles upward
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

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      latheGeometry.dispose();
      mannequinMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      poleGeometry.dispose();
      poleMaterial.dispose();
      baseGeometry.dispose();
      baseMaterial.dispose();
      finialGeometry.dispose();
      finialMaterial.dispose();
      tapeGeometry.dispose();
      tapeMaterial.dispose();
      ribbonGeometry.dispose();
      ribbonMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [category]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    />
  );
};
