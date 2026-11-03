export interface ModelAnnotation {
  id: string;
  title: string;
  category: string;
  description: string;
  specs?: { key: string; value: string }[];
  // 3D Point on the model surface where the line originates
  anchorPoint: [number, number, number];
  // 3D Point in space where the straight line ends and the label sits
  labelPoint: [number, number, number];
  // Surface normal vector at anchor
  normal: [number, number, number];
  color: string;
  createdAt: number;
  meshName?: string;
  // Controls individual annotation visibility in the scene and manager
  visible?: boolean;
}

export type ViewMode = 'solid' | 'wireframe' | 'xray';
export type LightingPreset = 'studio' | 'cyberpunk' | 'industrial';

export interface ModelStats {
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  materialCount: number;
  fileName?: string;
  fileSize?: string;
  dimensions?: { x: number; y: number; z: number };
}
