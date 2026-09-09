'use client';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import dynamic from 'next/dynamic';
import type { CropperProps, Area } from 'react-easy-crop';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Slider, Tooltip, Typography, CircularProgress, Alert,
} from '@mui/material';
import {
  RotateLeft, RotateRight, ZoomIn, ZoomOut, Crop as CropIcon, Restore,
} from '@mui/icons-material';
import {
  exportCrop, loadBitmap, formatBytes, type PixelCrop,
} from '../../lib/imageCrop';

// The cropper is only ever needed once an admin picks a file, so it is kept out
// of the initial bundle of every page that merely *has* an upload button.
//
// The props are narrowed to the ones actually passed: react-easy-crop declares
// the rest as required and fills them from defaultProps, which next/dynamic
// erases, so the unnarrowed type demands a dozen values the library would
// happily default.
type CropperUsedProps = Pick<
  CropperProps,
  | 'image' | 'crop' | 'zoom' | 'rotation' | 'aspect'
  | 'onCropChange' | 'onZoomChange' | 'onRotationChange' | 'onCropComplete'
  | 'zoomWithScroll' | 'showGrid'
>;
const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
}) as React.ComponentType<CropperUsedProps>;

// ── Surface presets ────────────────────────────────────────────
/**
 * One entry per place an image is displayed, so a call site never has to
 * restate the shape its own storefront component uses.
 *
 * `aspect` mirrors the storefront's own box and `minWidth` mirrors
 * MIN_SOURCE_WIDTH in the backend's imagePipeline — keep them in step, or the
 * dialog will happily produce a crop the server then rejects.
 */
export interface CropPreset {
  aspect: number | null;
  minWidth: number;
  maxBytes?: number;
  label: string;
  hint?: string;
}

const MB = 1048576;

/**
 * MAX_FILE_SIZE on the server, which every route except stores uses. Aiming
 * below it costs nothing visible and means a crop is never rejected for weight
 * after the admin has already framed it.
 */
const DEFAULT_MAX_BYTES = 5 * MB;

export const CROP_PRESETS = {
  product:       { aspect: 3 / 4,       minWidth: 1000, maxBytes: DEFAULT_MAX_BYTES, label: 'Product photo',   hint: 'Product tiles are 3:4 portrait.' },
  category:      { aspect: 4 / 5,       minWidth: 800,  maxBytes: DEFAULT_MAX_BYTES, label: 'Category card',   hint: 'Category cards are 4:5 portrait.' },
  collection:    { aspect: 4 / 3,       minWidth: 800,  maxBytes: DEFAULT_MAX_BYTES, label: 'Collection card' },
  // The collection page hero is a wide strip (1400x320 on desktop). Cropping
  // to 3:1 rather than the box's own 4.4:1 leaves a little room top and bottom,
  // which is what stops a phone — where the same box is far squarer — from
  // slicing the subject out of the sides.
  collectionBanner: { aspect: 3,        minWidth: 1440, maxBytes: DEFAULT_MAX_BYTES, label: 'Collection banner', hint: 'Wide artwork behind the collection title.' },
  bannerDesktop: { aspect: 1440 / 560,  minWidth: 1440, maxBytes: DEFAULT_MAX_BYTES, label: 'Desktop hero', hint: 'Wide 2.57:1 — keep any text well inside the frame.' },
  bannerMobile:  { aspect: 4 / 5,       minWidth: 800,  maxBytes: DEFAULT_MAX_BYTES, label: 'Mobile hero',  hint: 'Portrait art for phones.' },
  reelPoster:    { aspect: 9 / 16,      minWidth: 720,  maxBytes: DEFAULT_MAX_BYTES, label: 'Reel poster',  hint: 'Reels are vertical 9:16.' },
  blog:          { aspect: 16 / 9,      minWidth: 800,  maxBytes: DEFAULT_MAX_BYTES, label: 'Blog cover' },
  store:         { aspect: 4 / 3,       minWidth: 600,  maxBytes: 2 * MB, label: 'Store photo' },
  avatar:        { aspect: 1,           minWidth: 200,  maxBytes: DEFAULT_MAX_BYTES, label: 'Profile picture' },
  media:         { aspect: null,        minWidth: 600,  maxBytes: DEFAULT_MAX_BYTES, label: 'Media library', hint: 'Any shape — this library feeds several surfaces.' },
  logo:          { aspect: null,        minWidth: 200,  maxBytes: DEFAULT_MAX_BYTES, label: 'Logo' },
} satisfies Record<string, CropPreset>;

export type CropPresetName = keyof typeof CROP_PRESETS;

// ── Shape choices offered in the dialog ────────────────────────
const SHAPES: { key: string; label: string; aspect: number | null }[] = [
  { key: 'preset', label: 'Recommended', aspect: null },   // filled in per open
  { key: 'source', label: 'Original shape', aspect: null },
  { key: 'square', label: 'Square', aspect: 1 },
  { key: 'portrait', label: 'Portrait 4:5', aspect: 4 / 5 },
  { key: 'wide', label: 'Wide 16:9', aspect: 16 / 9 },
];

// ── Context ────────────────────────────────────────────────────
type CropRequest = (file: File, preset: CropPresetName) => Promise<File | null>;

const CropperContext = createContext<CropRequest | null>(null);

/**
 * Crop one image, resolving to the file to upload — or to null if the admin
 * backs out, in which case the caller should leave its own state untouched.
 *
 * Promise-based on purpose: an upload handler reads top to bottom
 * (`const cropped = await cropImage(file, 'product')`) instead of being split
 * across a dialog's callbacks.
 */
export const useImageCropper = (): CropRequest => {
  const ctx = useContext(CropperContext);
  if (!ctx) {
    throw new Error('useImageCropper must be used inside <ImageCropperProvider>');
  }
  return ctx;
};

/**
 * Crop a batch one after another, dropping any the admin cancels.
 * Used by the multi-file pickers (product gallery, media library).
 */
export const useImageCropperBatch = () => {
  const crop = useImageCropper();
  return useCallback(async (files: File[], preset: CropPresetName) => {
    const out: File[] = [];
    for (const file of files) {
      const done = await crop(file, preset);
      if (done) out.push(done);
    }
    return out;
  }, [crop]);
};

interface Pending {
  file: File;
  preset: CropPreset;
  resolve: (file: File | null) => void;
}

export default function ImageCropperProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [shape, setShape] = useState('preset');
  const [area, setArea] = useState<PixelCrop | null>(null);
  const [busy, setBusy] = useState(false);

  // A queued request must always be answered, or the caller's await hangs for
  // the life of the page.
  const settle = useRef<((file: File | null) => void) | null>(null);

  const request = useCallback<CropRequest>((file, presetName) => {
    return new Promise<File | null>((resolve) => {
      // A second request while one is open would otherwise strand the first
      // promise forever, and a batch loop awaiting it would never finish.
      settle.current?.(null);
      settle.current = resolve;
      setPending({ file, preset: CROP_PRESETS[presetName], resolve });
    });
  }, []);

  // Decode the picked file once the dialog opens.
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    const objectUrl = URL.createObjectURL(pending.file);
    setUrl(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setShape('preset');
    setArea(null);
    setLoadError(null);

    loadBitmap(pending.file)
      .then(bm => { if (!cancelled) setBitmap(bm); })
      .catch(() => { if (!cancelled) setLoadError('This file could not be opened as an image.'); });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(objectUrl);
    };
  }, [pending]);

  const presetAspect = pending?.preset.aspect ?? null;
  const sourceAspect = bitmap ? bitmap.width / bitmap.height : null;

  const activeAspect = useMemo(() => {
    if (shape === 'preset') return presetAspect ?? sourceAspect;
    if (shape === 'source') return sourceAspect;
    return SHAPES.find(s => s.key === shape)?.aspect ?? sourceAspect;
  }, [shape, presetAspect, sourceAspect]);

  const close = useCallback((result: File | null) => {
    settle.current?.(result);
    settle.current = null;
    setPending(null);
    setBitmap(null);
    setUrl(null);
  }, []);

  // ── Output metrics, shown live so the floor is never a surprise ──
  const outWidth = area ? Math.round(area.width) : 0;
  const outHeight = area ? Math.round(area.height) : 0;
  const minWidth = pending?.preset.minWidth ?? 0;
  const sourceTooSmall = Boolean(bitmap && bitmap.width < minWidth && bitmap.height < minWidth);
  const cropTooSmall = Boolean(area && outWidth < minWidth);

  const apply = async () => {
    if (!pending || !bitmap || !area) return;
    setBusy(true);
    try {
      // An untouched image is passed through rather than re-encoded. Every
      // re-encode costs a little quality, and there is nothing to gain when the
      // admin has not actually changed anything.
      const untouched =
        rotation === 0 &&
        area.width >= bitmap.width * 0.995 &&
        area.height >= bitmap.height * 0.995;
      if (untouched) {
        close(pending.file);
        return;
      }
      const file = await exportCrop(pending.file, bitmap, area, rotation, {
        maxBytes: pending.preset.maxBytes,
        minWidth: pending.preset.minWidth,
      });
      close(file);
    } catch {
      setLoadError('This image could not be processed. Try a different file.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setShape('preset');
  };

  const shapes = SHAPES.filter(s => (s.key === 'preset' ? presetAspect !== null : true));

  return (
    <CropperContext.Provider value={request}>
      {children}

      <Dialog
        open={Boolean(pending)}
        onClose={() => !busy && close(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid #f0f0f0' }}>
          <CropIcon sx={{ color: '#c9a84c' }} />
          Crop image
          {pending && (
            <Chip
              label={pending.preset.label}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: '#f8f4ef', color: '#8a6d1f' }}
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {loadError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{loadError}</Alert>
          ) : (
            <>
              {/* Shape picker */}
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                {shapes.map(s => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    size="small"
                    onClick={() => setShape(s.key)}
                    sx={{
                      fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer',
                      bgcolor: shape === s.key ? '#1a1a1a' : 'transparent',
                      color: shape === s.key ? '#fff' : '#555',
                      border: '1px solid', borderColor: shape === s.key ? '#1a1a1a' : '#ddd',
                      '&:hover': { bgcolor: shape === s.key ? '#1a1a1a' : '#f5f5f5' },
                    }}
                  />
                ))}
              </Box>

              {/* Crop stage */}
              <Box sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 300, sm: 380 },
                bgcolor: '#111',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                {url && (
                  <Cropper
                    image={url}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={activeAspect ?? 1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={(_: Area, pixels: Area) => setArea(pixels)}
                    zoomWithScroll
                    showGrid
                  />
                )}
                {!bitmap && !loadError && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={26} sx={{ color: '#c9a84c' }} />
                  </Box>
                )}
              </Box>

              {/* Zoom + rotate */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                <ZoomOut sx={{ color: '#999', fontSize: 20 }} />
                <Slider
                  value={zoom}
                  min={1}
                  max={4}
                  step={0.01}
                  onChange={(_, v) => setZoom(v as number)}
                  sx={{ color: '#c9a84c', flex: 1 }}
                  aria-label="Zoom"
                />
                <ZoomIn sx={{ color: '#999', fontSize: 20 }} />
                <Tooltip title="Rotate left">
                  <IconButton size="small" onClick={() => setRotation(r => (r - 90 + 360) % 360)}>
                    <RotateLeft fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rotate right">
                  <IconButton size="small" onClick={() => setRotation(r => (r + 90) % 360)}>
                    <RotateRight fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset">
                  <IconButton size="small" onClick={reset}>
                    <Restore fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Readout */}
              <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#555' }}>
                  Output {outWidth} × {outHeight} px
                </Typography>
                {bitmap && (
                  <Typography variant="caption" color="text.secondary">
                    from {bitmap.width} × {bitmap.height} · {formatBytes(pending?.file.size || 0)}
                  </Typography>
                )}
                {pending?.preset.hint && (
                  <Typography variant="caption" color="text.secondary">{pending.preset.hint}</Typography>
                )}
              </Box>

              {/* The resolution floor, explained before the upload is attempted
                  rather than as a 400 from the server afterwards. */}
              {sourceTooSmall ? (
                <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
                  This image is only {bitmap?.width} × {bitmap?.height}px. This slot needs at least{' '}
                  <strong>{minWidth}px</strong> wide, and enlarging cannot add detail — the storefront
                  would stretch it and it would look blurry. Please use a larger original.
                </Alert>
              ) : cropTooSmall ? (
                <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                  This crop is only {outWidth}px wide; at least <strong>{minWidth}px</strong> is needed.
                  Zoom out or drag the frame wider.
                </Alert>
              ) : null}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => close(null)} variant="outlined" disabled={busy} sx={{ borderColor: '#ddd', color: '#555' }}>
            Cancel
          </Button>
          <Button
            onClick={() => close(pending?.file ?? null)}
            disabled={busy || !pending}
            sx={{ color: '#555' }}
          >
            Use original
          </Button>
          <Button
            onClick={apply}
            variant="contained"
            disabled={busy || !area || !bitmap || cropTooSmall || sourceTooSmall}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700, minWidth: 120 }}
          >
            {busy ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Crop & use'}
          </Button>
        </DialogActions>
      </Dialog>
    </CropperContext.Provider>
  );
}
