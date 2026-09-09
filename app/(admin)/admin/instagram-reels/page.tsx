'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Alert, Snackbar, Tooltip, Avatar, Stack, CircularProgress,
  Grid, InputAdornment, LinearProgress, MenuItem,
} from '@mui/material';
import {
  Add, Edit, Delete, DragIndicator, Instagram, OpenInNew,
  VideoLibrary, Image as ImageIcon, Link as LinkIcon, CheckCircle, Cancel,
} from '@mui/icons-material';
import api from '../../../../lib/axios';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';
// Shared with the storefront embed so both accept exactly the same URLs.

interface Reel {
  id: string;
  title?: string;
  caption?: string;
  reelUrl: string;
  videoUrl?: string;
  thumbnail?: string;
  /** Storefront this reel is aimed at: ALL, WOMEN or MEN. */
  gender?: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Same vocabulary as banners, so "target gender" means one thing across the
 * admin. ALL is the default — a reel nobody has tagged keeps showing on both
 * storefronts rather than disappearing from both.
 */
const GENDERS = [
  { value: 'ALL', label: 'All Genders', short: 'ALL', color: '#607d8b' },
  { value: 'WOMEN', label: 'Women only', short: 'WOMEN', color: '#e91e8c' },
  { value: 'MEN', label: 'Men only', short: 'MEN', color: '#1565c0' },
];

const genderColor = (g?: string) =>
  GENDERS.find(x => x.value === (g || 'ALL'))?.color || '#607d8b';

const EMPTY: Partial<Reel> = {
  title: '',
  caption: '',
  reelUrl: '',
  videoUrl: '',
  thumbnail: '',
  gender: 'ALL',
  isActive: true,
  sortOrder: 0,
};

export default function InstagramReelsAdminPage() {
  const cropImage = useImageCropper();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Without this a multi-megabyte upload showed only a spinner, so there was no
  // way to tell a slow upload from a hung one.
  const [uploadPct, setUploadPct] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReel, setEditReel] = useState<Partial<Reel>>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  // Uploaded files take precedence over the URL fields on submit.
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  // Which target the table is scoped to. '' is everything; the values match
  // Reel.gender exactly, so this is a plain equality filter rather than the
  // storefront's "this gender + ALL" union.
  const [genderFilter, setGenderFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/instagram-reels/admin');
      setReels(data.data || []);
    } catch {
      setSnack({ msg: 'Failed to load reels', sev: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    // Adding while filtered to Men almost always means adding a men's reel.
    setEditReel({ ...EMPTY, gender: genderFilter || 'ALL', sortOrder: reels.length });
    setEditingId(null);
    setVideoFile(null);
    setThumbFile(null);
    setDialogOpen(true);
  };

  const openEdit = (r: Reel) => {
    setEditReel({ ...r, gender: r.gender || 'ALL' });
    setEditingId(r.id);
    setVideoFile(null);
    setThumbFile(null);
    setDialogOpen(true);
  };

  const save = async () => {
    // The video is the reel now — without one there is nothing to play.
    if (!editingId && !videoFile) {
      setSnack({ msg: 'Please upload a video file — that is what plays on the homepage.', sev: 'error' });
      return;
    }
    setSaving(true);
    setUploadPct(0);
    try {
      // Multipart only when a file is attached; otherwise keep the plain JSON
      // path so nothing about the existing URL-only flow changes.
      const hasFiles = !!(videoFile || thumbFile);
      let payload: any = editReel;
      let config: any = undefined;

      if (hasFiles) {
        const fd = new FormData();
        fd.append('reelUrl', editReel.reelUrl || '');
        fd.append('title', editReel.title || '');
        fd.append('caption', editReel.caption || '');
        fd.append('gender', editReel.gender || 'ALL');
        fd.append('isActive', String(editReel.isActive !== false));
        fd.append('sortOrder', String(editReel.sortOrder ?? 0));
        if (!videoFile && editReel.videoUrl) fd.append('videoUrl', editReel.videoUrl);
        if (!thumbFile && editReel.thumbnail) fd.append('thumbnail', editReel.thumbnail);
        if (videoFile) fd.append('video', videoFile);
        if (thumbFile) fd.append('thumbnail', thumbFile);
        payload = fd;
        config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          // The shared client times out at 30s, which is sized for JSON. A
          // 50 MB video does not finish transferring in that window on a normal
          // uplink, so the browser cancelled a request the server was still
          // reading — uploads were dying at 29.8s with nothing saved.
          timeout: 10 * 60 * 1000,
          onUploadProgress: (e: any) => {
            if (!e.total) return;
            setUploadPct(Math.round((e.loaded / e.total) * 100));
          },
        };
      }

      if (editingId) {
        await api.put(`/instagram-reels/${editingId}`, payload, config);
        setSnack({ msg: 'Reel updated', sev: 'success' });
      } else {
        await api.post('/instagram-reels', payload, config);
        setSnack({ msg: 'Reel added', sev: 'success' });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      // The generic message used to hide the real cause (bad URL, file too
      // large, wrong type), which made failures impossible to act on.
      setSnack({ msg: e?.response?.data?.message || 'Failed to save reel', sev: 'error' });
    } finally {
      setSaving(false);
      setUploadPct(0);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/instagram-reels/${deleteId}`);
      setSnack({ msg: 'Reel deleted', sev: 'success' });
      setDeleteId(null);
      load();
    } catch {
      setSnack({ msg: 'Failed to delete', sev: 'error' });
    }
  };

  const toggleActive = async (reel: Reel) => {
    try {
      await api.put(`/instagram-reels/${reel.id}`, { isActive: !reel.isActive });
      setReels(prev => prev.map(r => r.id === reel.id ? { ...r, isActive: !r.isActive } : r));
    } catch {
      setSnack({ msg: 'Failed to update status', sev: 'error' });
    }
  };


  const field = (key: keyof Reel) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditReel(prev => ({ ...prev, [key]: e.target.value }));

  // Filtered client-side: the whole list is already loaded and it is small, so
  // a round-trip per filter click would only add latency.
  const visibleReels = genderFilter
    ? reels.filter(r => (r.gender || 'ALL') === genderFilter)
    : reels;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            borderRadius: '10px', p: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Instagram sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Instagram Reels</Typography>
            <Typography variant="caption" color="text.secondary">
              Manage auto-playing reels shown on the homepage
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAdd}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, borderRadius: 2, fontWeight: 700 }}
        >
          Add Reel
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Reels', value: reels.length, color: '#1a1a1a' },
          { label: 'Active', value: reels.filter(r => r.isActive).length, color: '#2e7d32' },
          { label: 'Shown to Women', value: reels.filter(r => (r.gender || 'ALL') !== 'MEN').length, color: '#e91e8c' },
          { label: 'Shown to Men', value: reels.filter(r => (r.gender || 'ALL') !== 'WOMEN').length, color: '#1565c0' },
          { label: 'Missing Video', value: reels.filter(r => !r.videoUrl).length, color: '#e65100' },
        ].map(stat => (
          <Grid item xs={6} sm={4} md={2.4} key={stat.label}>
            <Card sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${stat.color}` }}>
              <Typography variant="h4" fontWeight={900} sx={{ color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Info banner */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <strong>Upload the video — that is the reel.</strong> It plays on hover on the homepage, muted, and is re-encoded on upload to a web-optimised 720px version so it starts instantly instead of buffering. The poster frame is generated automatically. Minimum 720px wide, vertical 9:16 — use the original file.
        <br />
        <strong>Show To</strong> decides which storefront it appears on: a <em>Women only</em> reel is hidden when the shopper switches to Men, and <em>All Genders</em> plays on both.
      </Alert>

      {/* Gender filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: '#666', mr: 0.5 }}>
          SHOW:
        </Typography>
        {[{ value: '', label: 'All reels', color: '#1a1a1a' }, ...GENDERS].map(opt => {
          const selected = genderFilter === opt.value;
          const count = opt.value
            ? reels.filter(r => (r.gender || 'ALL') === opt.value).length
            : reels.length;
          return (
            <Chip
              key={opt.value || 'all'}
              label={`${opt.label} (${count})`}
              size="small"
              onClick={() => setGenderFilter(opt.value)}
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                cursor: 'pointer',
                bgcolor: selected ? opt.color : 'transparent',
                color: selected ? '#fff' : opt.color,
                border: `1px solid ${opt.color}`,
                '&:hover': { bgcolor: selected ? opt.color : `${opt.color}18` },
              }}
            />
          );
        })}
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : visibleReels.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Instagram sx={{ fontSize: 56, color: '#ddd', mb: 2 }} />
            <Typography color="text.secondary" fontWeight={600}>
              {genderFilter ? `No reels targeted at ${genderFilter}` : 'No reels yet'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {genderFilter
                ? 'Reels tagged "All Genders" show here too — clear the filter to see them.'
                : 'Click "Add Reel" to get started'}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Preview</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Title / Caption</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Shown To</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleReels.map((reel, i) => {
                return (
                  <TableRow key={reel.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DragIndicator sx={{ color: '#ccc', fontSize: 18, cursor: 'grab' }} />
                        <Typography variant="caption" color="text.secondary">{i + 1}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{
                        width: 52, height: 88,
                        borderRadius: '8px', overflow: 'hidden',
                        bgcolor: '#111', position: 'relative',
                        flexShrink: 0,
                      }}>
                        {reel.thumbnail ? (
                          <Box
                            component="img"
                            src={reel.thumbnail}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          // No poster means no video was uploaded, since a
                          // poster is always extracted from one.
                          <Box sx={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <VideoLibrary sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>
                        {reel.title || <span style={{ color: '#aaa', fontStyle: 'italic', fontWeight: 400 }}>No title</span>}
                      </Typography>
                      {reel.caption && (
                        <Typography variant="caption" color="text.secondary" sx={{
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {reel.caption}
                        </Typography>
                      )}
                      <Box
                        component="a"
                        href={reel.reelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color: '#c9a84c', fontSize: '0.65rem', mt: 0.5, textDecoration: 'none' }}
                      >
                        View reel <OpenInNew sx={{ fontSize: 10 }} />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={GENDERS.find(g => g.value === (reel.gender || 'ALL'))?.short || 'ALL'}
                        size="small"
                        sx={{
                          bgcolor: genderColor(reel.gender),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={reel.videoUrl ? <VideoLibrary sx={{ fontSize: '14px !important' }} /> : <Instagram sx={{ fontSize: '14px !important' }} />}
                        label={reel.videoUrl ? 'Auto-play Video' : 'Instagram Embed'}
                        size="small"
                        sx={{
                          bgcolor: reel.videoUrl ? 'rgba(21,101,192,0.1)' : 'rgba(220,39,67,0.08)',
                          color: reel.videoUrl ? '#1565c0' : '#dc2743',
                          fontWeight: 700, fontSize: '0.65rem',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Switch
                        size="small"
                        checked={reel.isActive}
                        onChange={() => toggleActive(reel)}
                        sx={{ '& .MuiSwitch-track': { bgcolor: reel.isActive ? '#2e7d32' : undefined } }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(reel)} sx={{ color: '#1565c0' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteId(reel.id)} sx={{ color: '#d32f2f' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            borderRadius: '8px', p: 0.75,
            display: 'flex',
          }}>
            <Instagram sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          {editingId ? 'Edit Reel' : 'Add Instagram Reel'}
        </DialogTitle>

        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Instagram Reel URL */}
          <TextField
            label="Redirect URL (optional)"
            placeholder="https://www.instagram.com/reel/... or any product/page link"
            value={editReel.reelUrl || ''}
            onChange={field('reelUrl')}
            fullWidth size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 16, color: '#dc2743' }} /></InputAdornment>,
            }}
            // Tell the admin immediately when a URL will not embed, instead of
            // letting them save a reel that silently renders nothing.
            helperText="Where the tile goes when clicked. Leave blank and the tile simply is not clickable."
          />

          {/* Title */}
          <TextField
            label="Title (optional)"
            placeholder="e.g. Summer Collection 2025"
            value={editReel.title || ''}
            onChange={field('title')}
            fullWidth size="small"
          />

          {/* Caption */}
          <TextField
            label="Caption (optional)"
            placeholder="Short description shown on hover"
            value={editReel.caption || ''}
            onChange={field('caption')}
            fullWidth size="small"
            multiline rows={2}
          />

          {/* Target gender */}
          <TextField
            select
            label="Show To"
            value={editReel.gender || 'ALL'}
            onChange={(e) => setEditReel(prev => ({ ...prev, gender: e.target.value }))}
            fullWidth size="small"
            helperText="Which storefront plays this reel. All Genders shows it under both toggles."
          >
            {GENDERS.map(g => (
              <MenuItem key={g.value} value={g.value}>
                <Box component="span" sx={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  bgcolor: g.color, mr: 1,
                }} />
                {g.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Direct Video URL */}
          <Box>
            <TextField
              label="Video URL (if already hosted)"
              placeholder="https://cdn.example.com/video.mp4"
              value={editReel.videoUrl || ''}
              onChange={field('videoUrl')}
              fullWidth size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><VideoLibrary sx={{ fontSize: 16, color: '#1565c0' }} /></InputAdornment>,
              }}
              helperText="Or upload a file below. Autoplays silently on the homepage."
            />
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<VideoLibrary />}
              sx={{ mt: 1, borderColor: '#ccc', color: 'text.primary' }}
            >
              {videoFile ? `${videoFile.name.slice(0, 28)} (${(videoFile.size / 1048576).toFixed(1)} MB)` : 'Upload video file *'}
              <input
                hidden
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
            </Button>
            {videoFile && (
              <Button size="small" onClick={() => setVideoFile(null)} sx={{ mt: 1, ml: 1, color: '#d32f2f' }}>
                Remove
              </Button>
            )}
          </Box>

          {/* Thumbnail */}
          <TextField
            label="Thumbnail Image URL (optional)"
            placeholder="https://cdn.example.com/thumb.jpg"
            value={editReel.thumbnail || ''}
            onChange={field('thumbnail')}
            fullWidth size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><ImageIcon sx={{ fontSize: 16, color: '#555' }} /></InputAdornment>,
            }}
            helperText="Optional — generated from the video automatically. Upload one only to override it. Minimum 720px wide, vertical 9:16."
          />
          <Box sx={{ mt: -1 }}>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<ImageIcon />}
              sx={{ borderColor: '#ccc', color: 'text.primary' }}
            >
              {thumbFile ? `${thumbFile.name.slice(0, 28)}` : 'Upload poster image'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const picked = e.target.files?.[0] || null;
                  e.target.value = '';
                  if (!picked) { setThumbFile(null); return; }
                  // Framed to 9:16 up front, so the poster matches the tile the
                  // video plays in instead of being centre-cropped into it.
                  const f = await cropImage(picked, 'reelPoster');
                  setThumbFile(f);
                  if (!f) return;
                  // Read the dimensions locally so an undersized poster is
                  // caught instantly rather than after a failed upload.
                  const img = new window.Image();
                  img.onload = () => {
                    if (img.width < 720) {
                      setSnack({
                        msg: `Poster is only ${img.width}x${img.height}px. It needs to be at least 720px wide or it will look blurry.`,
                        sev: 'error',
                      });
                      setThumbFile(null);
                    } else if (img.height / img.width < 1.2) {
                      setSnack({
                        msg: `Poster is ${img.width}x${img.height}px. Reels are vertical (9:16) — a landscape image will be cropped heavily.`,
                        sev: 'error',
                      });
                    }
                    URL.revokeObjectURL(img.src);
                  };
                  img.src = URL.createObjectURL(f);
                }}
              />
            </Button>
            {thumbFile && (
              <Button size="small" onClick={() => setThumbFile(null)} sx={{ ml: 1, color: '#d32f2f' }}>
                Remove
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Sort Order"
              type="number"
              value={editReel.sortOrder ?? 0}
              onChange={(e) => setEditReel(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
              size="small" sx={{ width: 120 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editReel.isActive !== false}
                  onChange={(e) => setEditReel(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label={<Typography variant="body2" fontWeight={600}>Active</Typography>}
            />
          </Box>

          {/* Preview of what will actually play on the homepage */}
          {(videoFile || editReel.videoUrl) && (
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1, color: '#555' }}>
                PREVIEW
              </Typography>
              <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: 160, height: 285, border: '1px solid #eee', bgcolor: '#111' }}>
                <video
                  src={videoFile ? URL.createObjectURL(videoFile) : editReel.videoUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Plays on hover on the homepage.
              </Typography>
            </Box>
          )}
        </DialogContent>

        {saving && videoFile && (
          <Box sx={{ px: 3, pb: 1 }}>
            <LinearProgress
              variant={uploadPct > 0 && uploadPct < 100 ? 'determinate' : 'indeterminate'}
              value={uploadPct}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {uploadPct < 100
                ? `Uploading ${uploadPct}% of ${(videoFile.size / 1048576).toFixed(1)} MB…`
                : 'Upload complete — saving. The video is optimised in the background, so this finishes right away.'}
            </Typography>
          </Box>
        )}

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" disabled={saving} sx={{ borderColor: '#ddd', color: '#555' }}>
            Cancel
          </Button>
          <Button
            onClick={save}
            variant="contained"
            disabled={saving}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700, minWidth: 100 }}
          >
            {saving
              ? <CircularProgress size={18} sx={{ color: 'white' }} />
              : editingId ? 'Save Changes' : 'Add Reel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Reel?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This reel will be removed from the homepage permanently.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ borderColor: '#ddd', color: '#555' }}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
