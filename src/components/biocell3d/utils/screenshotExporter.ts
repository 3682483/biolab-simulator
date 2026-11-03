import { ModelAnnotation } from '../types/annotation';

export interface CaptureScreenshotOptions {
  canvas: HTMLCanvasElement;
  mountElement: HTMLElement;
  annotations: ModelAnnotation[];
  showAnnotations: boolean;
  selectedAnnotationId?: string | null;
  fileName?: string;
  onBeforeCapture?: () => void;
}

/**
 * Composites the WebGL 3D canvas together with all visible HTML DOM label cards
 * (titles, categories, borders, accent bars, and background boxes) into a single,
 * ultra-crisp high-DPI PNG screenshot.
 */
export function captureCompositedScreenshot({
  canvas,
  mountElement,
  annotations,
  showAnnotations,
  selectedAnnotationId,
  fileName = '3d-model-inspection-with-labels.png',
  onBeforeCapture,
}: CaptureScreenshotOptions): void {
  if (onBeforeCapture) {
    onBeforeCapture();
  }

  // Create high-resolution offscreen composite canvas matching WebGL native buffer dimensions
  const compCanvas = document.createElement('canvas');
  compCanvas.width = canvas.width;
  compCanvas.height = canvas.height;
  const ctx = compCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw WebGL 3D render (includes model, 3D pointer lines, and surface glowing dots)
  ctx.drawImage(canvas, 0, 0);

  // 2. Composite all visible 3D label cards & text details
  if (showAnnotations && annotations.length > 0) {
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    annotations.forEach((anno) => {
      if (anno.visible === false) return;
      const labelContainer = mountElement.querySelector<HTMLElement>(`[data-annotation-id="${anno.id}"]`);
      if (!labelContainer) return;

      // Check if element is displayed and visible
      const style = window.getComputedStyle(labelContainer);
      if (
        labelContainer.style.display === 'none' ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity || '1') <= 0.05
      ) {
        return;
      }

      const card = labelContainer.firstElementChild as HTMLElement | null;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const bx = (rect.left - canvasRect.left) * scaleX;
      const by = (rect.top - canvasRect.top) * scaleY;
      const bw = rect.width * scaleX;
      const bh = rect.height * scaleY;

      // Skip if completely outside canvas view
      if (bx + bw < 0 || bx > compCanvas.width || by + bh < 0 || by > compCanvas.height) {
        return;
      }

      const isSelected = selectedAnnotationId === anno.id;
      const radius = 10 * scaleX;
      const barWidth = 3.5 * scaleX;

      ctx.save();

      // Soft Shadow
      ctx.shadowColor = isSelected ? 'rgba(6, 182, 212, 0.5)' : 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = (isSelected ? 16 : 10) * scaleX;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4 * scaleY;

      // Card Background Box
      ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.96)' : 'rgba(2, 6, 23, 0.92)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, radius);
      ctx.fill();

      // Card Outline Border
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(51, 65, 85, 0.85)';
      ctx.lineWidth = 1 * scaleX;
      ctx.stroke();

      // Accent colored vertical bar on left or right edge
      const isRightBar = card.style.borderRightWidth === '3.5px';
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = anno.color || '#22d3ee';
      ctx.beginPath();
      if (isRightBar) {
        ctx.roundRect(bx + bw - barWidth, by, barWidth, bh, [0, radius, radius, 0]);
      } else {
        ctx.roundRect(bx, by, barWidth, bh, [radius, 0, 0, radius]);
      }
      ctx.fill();

      // Title Text
      const textX = bx + 12 * scaleX + (isRightBar ? 0 : barWidth / 2);
      const titleFontSize = Math.round(12 * scaleY);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textBaseline = 'top';
      const titleY = anno.category ? by + 7 * scaleY : by + (bh - titleFontSize) / 2;
      ctx.fillText(anno.title, textX, titleY);

      // Category / Description subtitle
      if (anno.category) {
        const catFontSize = Math.round(10 * scaleY);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${catFontSize}px monospace, -apple-system, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(anno.category, textX, by + 23 * scaleY);
      }

      ctx.restore();
    });
  }

  // Trigger download
  const dataURL = compCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
