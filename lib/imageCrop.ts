/**
 * Client-side crop / resize, applied before an image is uploaded.
 *
 * Why crop in the browser at all, when the backend already has a Sharp
 * pipeline? Because the pipeline can only decide *how* to encode an image, not
 * *what part of it matters*. Every storefront surface has a fixed shape — a
 * product tile is 3:4, a hero is 1440:560 — and `object-fit: cover` silently
 * throws away whatever does not fit. That is how a headline baked into banner
 * artwork ends up sliced in half. Letting the admin choose the crop moves that
 * decision from the browser's blind centre-crop to the person who knows which
 * part of the photo is the subject.
 *
 * Two rules the exporter never breaks:
 *  1. It never upscales. Output is the crop's true pixel size, capped, so the
 *     "store big, serve small" contract with the derivative pipeline holds.
 *  2. It never silently produces a file the server will reject. Byte budgets
 *     are met by lowering quality, and resolution floors are surfaced in the UI
 *     before the upload is attempted.
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportOptions {
  /** Hard ceiling on the stored width. Well above what any surface requests. */
  maxWidth?: number;
  /** Server-side file size cap for this folder, in bytes. */
  maxBytes?: number;
  /**
   * Resolution floor for the surface. Shrinking to meet a byte budget stops
   * here — a file small enough to upload but too small to render sharply has
   * only traded one failure for another.
   */
  minWidth?: number;
}

/** Nothing on the storefront asks for more than 1920w; 2560 leaves headroom. */
const MAX_OUTPUT_WIDTH = 2560;

/**
 * Decode a file into a bitmap with EXIF rotation already applied.
 *
 * Phone photos carry their orientation in EXIF rather than in the pixel data.
 * `<img>` honours it, a raw canvas draw does not — so without
 * `imageOrientation: 'from-image'` the admin crops a portrait photo and gets a
 * sideways file back.
 */
export const loadBitmap = async (file: File): Promise<ImageBitmap> => {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Safari < 15 has no options bag on createImageBitmap. Falling back to an
    // <img> keeps the feature working there, since <img> applies EXIF itself.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
};

/**
 * PNG is kept only when the source is a PNG, because it is the one format here
 * that can carry transparency (logos, in practice). Everything else becomes
 * JPEG: WebP output would be re-encoded by the pipeline anyway, and JPEG is the
 * format every one of these upload routes already accepts.
 */
const outputType = (file: File) => (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

/**
 * Render the selected region and encode it to a File.
 *
 * Rotation is applied by drawing the whole bitmap onto an oversized canvas
 * around its centre and then lifting the crop out of it — the crop rectangle
 * react-easy-crop reports is expressed in that rotated space, so cropping first
 * and rotating after would land somewhere else entirely.
 */
export const exportCrop = async (
  file: File,
  bitmap: ImageBitmap,
  crop: PixelCrop,
  rotation = 0,
  options: ExportOptions = {}
): Promise<File> => {
  const { maxWidth = MAX_OUTPUT_WIDTH, maxBytes, minWidth = 1 } = options;

  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const boxW = bitmap.width * cos + bitmap.height * sin;
  const boxH = bitmap.width * sin + bitmap.height * cos;

  const stage = document.createElement('canvas');
  stage.width = Math.round(boxW);
  stage.height = Math.round(boxH);
  const sctx = stage.getContext('2d');
  if (!sctx) throw new Error('Canvas is unavailable in this browser.');
  sctx.imageSmoothingQuality = 'high';
  sctx.translate(boxW / 2, boxH / 2);
  sctx.rotate(rad);
  sctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

  // Only ever shrink. Enlarging here would hand the pipeline a soft image and
  // defeat the resolution floors it enforces on upload.
  const scale = Math.min(1, maxWidth / crop.width);
  const outW = Math.max(1, Math.round(crop.width * scale));

  const type = outputType(file);
  const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/png' ? '.png' : '.jpg');

  /** Render the crop at a given output width and encode it once. */
  const encodeAt = async (width: number, quality?: number): Promise<Blob | null> => {
    const height = Math.max(1, Math.round((width * crop.height) / crop.width));
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const octx = out.getContext('2d');
    if (!octx) throw new Error('Canvas is unavailable in this browser.');
    octx.imageSmoothingQuality = 'high';
    if (type === 'image/jpeg') {
      // JPEG has no alpha; without this, transparent pixels encode as black.
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, width, height);
    }
    octx.drawImage(stage, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    return canvasToBlob(out, type, quality);
  };

  // Quality first, resolution second. Dropping quality stays invisible long
  // after dropping pixels would not, so a byte budget is met the cheapest way
  // available — and the shrinking stops at the surface's floor, because a file
  // that uploads but renders blurry has only swapped one failure for another.
  //
  // Quality alone is not always enough: a detailed 2400px photo can still miss
  // a tight budget at the bottom of the ladder, which used to be returned
  // silently over-budget for the server to reject.
  //
  // PNG is kept only for transparency and has no quality knob, so for PNG this
  // reduces to the resolution pass alone.
  const qualities = type === 'image/png' ? [undefined] : [0.95, 0.9, 0.85, 0.78, 0.7, 0.6, 0.5];
  const floor = Math.min(minWidth, outW);

  let best: Blob | null = null;
  let width = outW;
  for (;;) {
    for (const quality of qualities) {
      const blob = await encodeAt(width, quality);
      if (!blob) continue;
      if (!best || blob.size < best.size) best = blob;
      if (!maxBytes || blob.size <= maxBytes) {
        return new File([blob], name, { type, lastModified: Date.now() });
      }
    }
    const next = Math.round(width * 0.8);
    if (next < floor) break;
    width = next;
  }

  // Still over budget at the resolution floor. Hand back the smallest attempt
  // rather than failing outright: the caller's budget is a target taken from
  // the server's default cap, and the server states its own limit clearly if
  // it does refuse.
  if (!best) throw new Error('Could not process this image.');
  return new File([best], name, { type, lastModified: Date.now() });
};

/**
 * The largest rectangle of `aspect` that fits inside the image, centred.
 *
 * This is what the dialog opens on, so an admin who is happy with the framing
 * confirms once and is done — cropping should be an opportunity, not a toll.
 */
export const maxCentredCrop = (
  width: number,
  height: number,
  aspect: number | null
): PixelCrop => {
  if (!aspect) return { x: 0, y: 0, width, height };
  const byWidth = width / aspect <= height;
  const w = byWidth ? width : height * aspect;
  const h = byWidth ? width / aspect : height;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
};

export const formatBytes = (bytes: number) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
