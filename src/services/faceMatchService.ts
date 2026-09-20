import { FaceDetector, FilesetResolver, type Detection } from '@mediapipe/tasks-vision';

export type FaceEngineKind = 'mediapipe' | 'native' | 'unavailable';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  keypoints: Array<{ x: number; y: number }>;
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

const CROP = 32;
/** Cosine similarity on mean-centered face crop. Demo-grade, not bank-grade. */
export const MATCH_THRESHOLD = 0.9;
const MIN_FACE_FRACTION = 0.07;

let engineKind: FaceEngineKind | null = null;
let detector: FaceDetector | null = null;
let lastVideoTs = 0;

type NativeFaceDetector = {
  detect: (image: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

let nativeDetector: NativeFaceDetector | null = null;

export async function ensureFaceEngine(): Promise<FaceEngineKind> {
  if (engineKind) return engineKind;
  try {
    const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
    detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.55,
    });
    engineKind = 'mediapipe';
    return engineKind;
  } catch (err) {
    console.warn('MediaPipe FaceDetector unavailable, trying native API', err);
  }
  try {
    const Ctor = (window as unknown as { FaceDetector?: new () => NativeFaceDetector }).FaceDetector;
    if (Ctor) {
      nativeDetector = new Ctor();
      engineKind = 'native';
      return engineKind;
    }
  } catch {
    // ignore
  }
  engineKind = 'unavailable';
  return engineKind;
}

export async function detectFace(video: HTMLVideoElement): Promise<FaceBox | null> {
  const kind = await ensureFaceEngine();
  if (!video.videoWidth || !video.videoHeight) return null;

  if (kind === 'mediapipe' && detector) {
    let ts = performance.now();
    if (ts <= lastVideoTs) ts = lastVideoTs + 1;
    lastVideoTs = ts;
    try {
      const result = detector.detectForVideo(video, ts);
      return pickBest(result.detections, video.videoWidth, video.videoHeight);
    } catch {
      return null;
    }
  }

  if (kind === 'native' && nativeDetector) {
    const faces = await nativeDetector.detect(video);
    if (!faces.length) return null;
    const box = faces[0].boundingBox;
    return toBox(box.x, box.y, box.width, box.height, 1, video.videoWidth, video.videoHeight, []);
  }

  return null;
}

export function extractDescriptor(video: HTMLVideoElement, box: FaceBox): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = CROP;
  canvas.height = CROP;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, CROP, CROP);
  const { data } = ctx.getImageData(0, 0, CROP, CROP);
  const luma: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    luma.push((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255);
  }
  const mean = luma.reduce((s, v) => s + v, 0) / luma.length;
  const centered = luma.map((v) => v - mean);
  const keypoints = box.keypoints.slice(0, 6).flatMap((pt) => [
    (pt.x - box.x) / Math.max(box.width, 1),
    (pt.y - box.y) / Math.max(box.height, 1),
  ]);
  while (keypoints.length < 12) keypoints.push(0);
  return [...centered, ...keypoints];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function isSameFace(live: number[], enrolled: number[]): boolean {
  return cosineSimilarity(live, enrolled) >= MATCH_THRESHOLD;
}

export function captureJpeg(video: HTMLVideoElement, box?: FaceBox): string {
  const canvas = document.createElement('canvas');
  const size = Math.min(video.videoWidth || 480, video.videoHeight || 480, 480);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  if (box) {
    const side = Math.max(box.width, box.height);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    ctx.drawImage(video, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size);
  } else {
    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
  }
  return canvas.toDataURL('image/jpeg', 0.88);
}

function pickBest(
  detections: Detection[],
  frameW: number,
  frameH: number
): FaceBox | null {
  let best: FaceBox | null = null;
  for (const det of detections) {
    const bb = det.boundingBox;
    if (!bb) continue;
    const score = det.categories[0]?.score ?? 0;
    const box = toBox(
      bb.originX,
      bb.originY,
      bb.width,
      bb.height,
      score,
      frameW,
      frameH,
      det.keypoints.map((k) => ({ x: k.x * frameW, y: k.y * frameH }))
    );
    if (!box) continue;
    if (!best || box.score > best.score) best = box;
  }
  return best;
}

function toBox(
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
  frameW: number,
  frameH: number,
  keypoints: Array<{ x: number; y: number }>
): FaceBox | null {
  const area = (w * h) / Math.max(frameW * frameH, 1);
  if (area < MIN_FACE_FRACTION) return null;
  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(w, frameW),
    height: Math.min(h, frameH),
    score,
    keypoints,
  };
}
