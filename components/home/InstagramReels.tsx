'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Box, Container, Typography, IconButton } from '@mui/material';
import { Instagram, PlayArrow, VolumeOff, VolumeUp, OpenInNew } from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface InstagramReel {
  id: string;
  title?: string | null;
  caption?: string | null;
  reelUrl: string;
  videoUrl?: string | null;
  thumbnail?: string | null;
}

interface Props {
  reels: InstagramReel[];
  sectionTitle?: string;
}

// ── Individual reel card ───────────────────────────────────────────
interface ReelCardProps {
  reel: InstagramReel;
  index: number;
}

function ReelCard({ reel, index }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // Play on hover, pause and rewind on leave.
  //
  // preload="none" means the file is not fetched until this fires, so a page of
  // tiles costs nothing until the visitor shows intent. On touch devices there
  // is no hover, so the first tap plays and the second follows the link.
  const handleEnter = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const handleLeave = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
  }, []);

  /**
   * Clicking the tile follows the redirect the admin set. It is optional: when
   * blank the tile is simply not a link, rather than navigating nowhere.
   */
  const handleOpen = useCallback(() => {
    const target = reel.reelUrl?.trim();
    if (!target) return;
    window.open(target, '_blank', 'noopener,noreferrer');
  }, [reel.reelUrl]);

  // Touch devices get no hover, so play once the tile scrolls into view.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().then(() => setPlaying(true)).catch(() => {});
        else { el.pause(); setPlaying(false); }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reel.videoUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 4) * 0.08, duration: 0.45 }}
      style={{ flexShrink: 0 }}
    >
      <Box
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleOpen}
        sx={{
          width: { xs: 180, sm: 210, md: 240 },
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          aspectRatio: '9 / 16',
          bgcolor: '#111',
          cursor: reel.reelUrl?.trim() ? 'pointer' : 'default',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          '&:hover .reel-overlay': { opacity: 1 },
          '&:hover .reel-scale': { transform: 'scale(1.03)' },
          transition: 'box-shadow 0.3s',
          '&:hover': { boxShadow: '0 16px 48px rgba(0,0,0,0.28)' },
        }}
      >
        {/* Poster underneath: always painted, so the tile never shows a
            black box while the video loads. Goes through next/image, so a
            1080x1920 upload is delivered as a ~240px AVIF. */}
        {reel.thumbnail && (
          <Image
            src={reel.thumbnail}
            alt={reel.title || 'Reel'}
            fill
            sizes="(max-width: 600px) 180px, (max-width: 900px) 210px, 240px"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
        )}

        {/* Video layered on top. preload="none" means nothing is fetched until
            the visitor actually hovers — 20 tiles cost zero bandwidth at rest. */}
        {reel.videoUrl && (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.thumbnail || undefined}
            muted={muted}
            loop
            playsInline
            preload="none"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: playing ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          />
        )}

        {/* Play affordance, hidden once the video is actually running */}
        {!playing && (
          <Box sx={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Box sx={{
              bgcolor: 'rgba(0,0,0,0.45)', borderRadius: '50%',
              width: 52, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PlayArrow sx={{ color: 'white', fontSize: 30 }} />
            </Box>
          </Box>
        )}

        {reel.videoUrl && (
          <IconButton
            size="small"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMuted(!muted); }}
            sx={{
              position: 'absolute', bottom: 52, right: 8, zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
              width: 28, height: 28,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            {muted ? <VolumeOff sx={{ fontSize: 14 }} /> : <VolumeUp sx={{ fontSize: 14 }} />}
          </IconButton>
        )}

        {/* Gradient overlay */}
        <Box
          className="reel-overlay"
          sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
            opacity: reel.videoUrl ? 1 : 0,
            transition: 'opacity 0.3s', pointerEvents: 'none',
          }}
        />

        {/* Instagram badge */}
        <Box sx={{
          position: 'absolute', top: 10, right: 10,
          bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%',
          width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Instagram sx={{ fontSize: 16, color: 'white' }} />
        </Box>

        {/* Bottom meta */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
        }}>
          {reel.title && (
            <Typography sx={{
              color: 'white', fontWeight: 700, fontSize: '0.72rem', lineHeight: 1.3, mb: 0.4,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {reel.title}
            </Typography>
          )}
          {reel.reelUrl?.trim() && (
          <Box
            component="a"
            href={reel.reelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.4,
              color: '#c9a84c', fontSize: '0.6rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none',
              '&:hover': { color: 'white' },
            }}
          >
            View on Instagram
            <OpenInNew sx={{ fontSize: 10 }} />
          </Box>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

// ── Parent ────────────────────────────────────────────────────────
export default function InstagramReels({ reels, sectionTitle }: Props) {
  // Playback is now driven per-card by hover (and by an in-view observer on
  // touch devices, where hover does not exist). The shared observer that used
  // to dispatch reel:play / reel:pause events is gone with it.

  if (!reels || reels.length === 0) return null;

  return (
    <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#fafafa', overflow: 'hidden' }}>
      <Container maxWidth="xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 3, md: 5 }, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{
                  background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  borderRadius: '8px', p: 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Instagram sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9a84c' }}>
                  Instagram
                </Typography>
              </Box>
              <Typography variant="h2" sx={{
                fontFamily: 'var(--font-playfair)', fontWeight: 700,
                fontSize: { xs: '1.7rem', sm: '2.3rem', md: '2.8rem' },
                color: '#111', letterSpacing: '-0.02em', lineHeight: 1.05,
              }}>
                {sectionTitle || 'Reels & Looks'}
              </Typography>
            </Box>
            <Box
              component="a"
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                px: 2, py: 1, border: '1px solid #ddd', borderRadius: '24px',
                color: '#555', fontSize: '0.72rem', fontWeight: 700,
                textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#c9a84c', color: '#c9a84c', bgcolor: 'rgba(201,168,76,0.04)' },
              }}
            >
              <Instagram sx={{ fontSize: 16 }} />
              Follow Us
            </Box>
          </Box>
        </motion.div>

        {/* Horizontal scroll strip */}
        <Box
          className="h-scroll"
          sx={{
            display: 'flex',
            gap: { xs: 1.5, md: 2 },
            // A single card left-aligned in a full-width container reads as a
            // layout bug. Centre until there are enough to fill the row.
            justifyContent: { xs: 'flex-start', md: reels.length < 5 ? 'center' : 'flex-start' },
            overflowX: 'auto',
            pb: 1,
            mx: { xs: -2, md: 0 },
            px: { xs: 2, md: 0 },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollSnapType: 'x proximity',
            '& > *': { scrollSnapAlign: 'start' },
          }}
        >
          {reels.map((reel, i) => (
            <ReelCard key={reel.id} reel={reel} index={i} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
