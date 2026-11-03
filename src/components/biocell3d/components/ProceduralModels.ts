import * as THREE from 'three';

/**
 * Creates a high-precision mechanical aerospace turbine assembly
 * to demonstrate universal multi-model 3D annotation capabilities
 */
export function createProceduralMechanical(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PrecisionTurbineEngine';

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.25,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.2,
  });

  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.7,
    roughness: 0.3,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.5,
  });

  // 1. Central Rotor Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 32);
  const shaft = new THREE.Mesh(shaftGeo, metalMat);
  shaft.rotation.z = Math.PI * 0.5;
  shaft.name = 'Rotor_Shaft';
  shaft.userData = { initialPos: shaft.position.clone(), explodedVector: new THREE.Vector3(-0.4, 0, 0) };
  group.add(shaft);

  // 2. Multi-stage Bladed Impeller
  const impellerGroup = new THREE.Group();
  impellerGroup.name = 'Bladed_Impeller';
  impellerGroup.userData = { initialPos: impellerGroup.position.clone(), explodedVector: new THREE.Vector3(0.5, 0.3, 0) };

  const hubGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.25, 32);
  const hub = new THREE.Mesh(hubGeo, goldMat);
  hub.rotation.z = Math.PI * 0.5;
  impellerGroup.add(hub);

  // 16 aerodynamic turbine blades
  const bladeGeo = new THREE.BoxGeometry(0.45, 0.03, 0.12);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, cyanMat);
    blade.position.set(0, Math.cos(angle) * 0.58, Math.sin(angle) * 0.58);
    blade.rotation.x = angle + 0.35;
    impellerGroup.add(blade);
  }
  group.add(impellerGroup);

  // 3. Stator Casing Rings (Cutaway)
  const casingGroup = new THREE.Group();
  casingGroup.name = 'Stator_Casing';
  casingGroup.userData = { initialPos: casingGroup.position.clone(), explodedVector: new THREE.Vector3(0, -0.6, 0) };

  const ringGeo = new THREE.TorusGeometry(0.9, 0.12, 16, 48, Math.PI * 1.5);
  const casing = new THREE.Mesh(ringGeo, darkMat);
  casing.rotation.y = Math.PI * 0.5;
  casingGroup.add(casing);

  // Fastener bolts array
  const boltGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
  for (let b = 0; b < 12; b++) {
    const bAngle = (b / 12) * Math.PI * 1.5;
    const bolt = new THREE.Mesh(boltGeo, metalMat);
    bolt.position.set(0.12, Math.cos(bAngle) * 0.9, Math.sin(bAngle) * 0.9);
    bolt.rotation.z = Math.PI * 0.5;
    casingGroup.add(bolt);
  }
  group.add(casingGroup);

  return group;
}
