import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { ModelAnnotation } from '../types/annotation';

/**
 * Creates an in-memory 2D canvas texture with crisp, sleek engineering typography
 * for baking 3D label plates into the exported GLB file.
 */
function createLabelCanvasTexture(title: string, category: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Semi-translucent dark aerospace glass backdrop
    ctx.fillStyle = 'rgba(8, 12, 24, 0.94)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 144, 16);
    ctx.fill();

    // 2. Refined, delicate glowing border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 3. Category Tag Pill Badge
    ctx.font = 'bold 20px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';
    const tagText = category || '部件标注';
    const tagWidth = ctx.measureText(tagText).width + 24;
    
    // Category pill background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(24, 26, tagWidth, 28, 6);
    ctx.fill();

    // Category pill border
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Category text
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, 36, 40);

    // 4. Accent left indicator strip
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(8, 22, 5, 116, [3, 0, 0, 3]);
    ctx.fill();

    // 5. Title Text (White, crisp, high contrast)
    ctx.font = 'bold 32px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 26, 96, 460);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Packages the 3D model together with all annotations (3D straight pointer lines,
 * surface anchor nodes, and 3D label plates with metadata) into a new binary GLB file.
 *
 * Scales label plates and lines accurately relative to the model's actual physical bounding box,
 * preventing oversized or out-of-proportion labels when exported.
 */
export async function exportModelWithAnnotationsToGLB(
  modelGroup: THREE.Group,
  annotations: ModelAnnotation[],
  fileName: string = 'model-with-labels.glb'
): Promise<void> {
  // Create an export container scene
  const exportScene = new THREE.Scene();
  exportScene.name = 'AnnotatedModelExport';

  // 1. Clone the current model
  const clonedModel = modelGroup.clone(true);
  exportScene.add(clonedModel);

  const modelScale = modelGroup.scale.x || 1;

  // Compute the model's actual world bounding box to determine proportional label sizing
  clonedModel.updateMatrixWorld(true);
  const modelBox = new THREE.Box3().setFromObject(clonedModel);
  const modelSize = modelBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 2.0;

  // Proportional sizing: delicate, accurate, matching the web UI aspect ratio and scale
  // Rather than blowing up with raw scale factors, label plate is scaled to ~13-16% of model dimension
  const plateWidth = Math.max(0.18, Math.min(0.38, maxDim * 0.135));
  const plateHeight = plateWidth * (160 / 512); // Maintain 512x160 canvas ratio
  const lineRadius = Math.max(0.0012, maxDim * 0.0016);
  const anchorRadius = Math.max(0.008, maxDim * 0.008);
  const endDotRadius = anchorRadius * 0.7;

  // Filter only visible annotations (respecting user's visibility choices)
  const activeAnnotations = annotations.filter((anno) => anno.visible !== false);

  // 2. Create 3D annotation components group
  const annotationsGroup = new THREE.Group();
  annotationsGroup.name = 'Spatial_3D_Annotations';

  activeAnnotations.forEach((anno, index) => {
    const singleAnnoGroup = new THREE.Group();
    singleAnnoGroup.name = `Annotation_${index + 1}_${anno.title.replace(/\s+/g, '_')}`;
    singleAnnoGroup.userData = {
      id: anno.id,
      title: anno.title,
      category: anno.category,
      description: anno.description,
      specs: anno.specs,
    };

    const pAnchor = new THREE.Vector3(
      anno.anchorPoint[0] * modelScale,
      anno.anchorPoint[1] * modelScale,
      anno.anchorPoint[2] * modelScale
    );

    const pLabel = new THREE.Vector3(
      anno.labelPoint[0] * modelScale,
      anno.labelPoint[1] * modelScale,
      anno.labelPoint[2] * modelScale
    );

    const annoColor = new THREE.Color(anno.color);

    // A. Surface Anchor Glowing Particle Node
    const anchorGeo = new THREE.SphereGeometry(anchorRadius, 16, 16);
    const anchorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#67e8f9'),
      emissive: new THREE.Color('#22d3ee'),
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
    anchorMesh.name = `Anchor_Particle_${anno.title}`;
    anchorMesh.position.copy(pAnchor);
    singleAnnoGroup.add(anchorMesh);

    // B. 3D Straight Pointer Line in Soft Cyan
    const lineDir = new THREE.Vector3().subVectors(pLabel, pAnchor);
    const lineLength = lineDir.length();
    const lineCenter = new THREE.Vector3().addVectors(pAnchor, pLabel).multiplyScalar(0.5);

    if (lineLength > 0.001) {
      const cylinderGeo = new THREE.CylinderGeometry(
        lineRadius,
        lineRadius,
        lineLength,
        8
      );
      const lineMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#22d3ee'),
        emissive: new THREE.Color('#0891b2'),
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.5,
      });
      const lineMesh = new THREE.Mesh(cylinderGeo, lineMat);
      lineMesh.name = `Pointer_Line_${anno.title}`;
      lineMesh.position.copy(lineCenter);

      // Orient cylinder along the vector from pAnchor to pLabel
      const upVector = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, lineDir.clone().normalize());
      lineMesh.setRotationFromQuaternion(quaternion);
      singleAnnoGroup.add(lineMesh);
    }

    // C. Small Endpoint Node docked at the label connection
    const endDotGeo = new THREE.SphereGeometry(endDotRadius, 12, 12);
    const endDotMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      emissive: annoColor,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const endDotMesh = new THREE.Mesh(endDotGeo, endDotMat);
    endDotMesh.position.copy(pLabel);
    singleAnnoGroup.add(endDotMesh);

    // D. 3D Label Plate with baked canvas texture
    // Dock the plate so the pointer line reaches the left or right edge cleanly
    const isRight = pLabel.x >= pAnchor.x;
    const plateCenterX = isRight ? pLabel.x + plateWidth * 0.5 : pLabel.x - plateWidth * 0.5;
    const plateCenterY = pLabel.y;
    const plateCenterZ = pLabel.z;

    const plateGeo = new THREE.PlaneGeometry(plateWidth, plateHeight);
    const labelTexture = createLabelCanvasTexture(anno.title, anno.category, anno.color);
    const plateMat = new THREE.MeshBasicMaterial({
      map: labelTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.name = `Label_Plate_${anno.title}`;
    plateMesh.position.set(plateCenterX, plateCenterY, plateCenterZ);

    // Face towards general viewing angle (front-facing +Z)
    plateMesh.lookAt(new THREE.Vector3(plateCenterX, plateCenterY, plateCenterZ + 1));
    singleAnnoGroup.add(plateMesh);

    annotationsGroup.add(singleAnnoGroup);
  });

  exportScene.add(annotationsGroup);

  // 3. Export to binary GLB
  const exporter = new GLTFExporter();
  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      exportScene,
      (gltf) => {
        try {
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          const downloadAnchor = document.createElement('a');
          downloadAnchor.href = url;
          downloadAnchor.download = fileName;
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          URL.revokeObjectURL(url);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      (error) => {
        console.error('Failed to export GLB:', error);
        reject(error);
      },
      {
        binary: true,
        embedImages: true,
      }
    );
  });
}
