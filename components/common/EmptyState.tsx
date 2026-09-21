'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import Reveal from './Reveal';

interface Props {
  icon: ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** e.g. an error state: uses the retry action instead of a link. */
  tone?: 'empty' | 'error';
}

/** Designed empty / error state: walnut-tinted icon disc, serif title, one clear action. */
export default function EmptyState({ icon, title, body, actionLabel, actionHref, onAction, tone = 'empty' }: Props) {
  return (
    <Reveal y={12}>
      <Box sx={{ textAlign: 'center', py: { xs: 6, md: 9 }, px: 2 }} role={tone === 'error' ? 'alert' : undefined}>
        <Box sx={{
          width: 88, height: 88, mx: 'auto', mb: 3, borderRadius: '50%', display: 'grid', placeItems: 'center',
          bgcolor: tone === 'error' ? '#FBEAE8' : '#F1E8D8', color: tone === 'error' ? '#B3261E' : '#A0693A',
          '& svg': { fontSize: 40 },
        }}>
          {icon}
        </Box>
        <Typography component="h2" sx={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600, fontSize: { xs: '1.9rem', md: '2.3rem' }, color: '#3B2314', mb: 1 }}>
          {title}
        </Typography>
        {body && <Typography sx={{ color: '#6B5646', maxWidth: 420, mx: 'auto', mb: 3.5, lineHeight: 1.7 }}>{body}</Typography>}
        {actionLabel && (
          <Button
            variant="contained"
            {...(actionHref ? { component: Link, href: actionHref } : { onClick: onAction })}
            sx={{ bgcolor: '#3B2314', px: 5, py: 1.5, '&:hover': { bgcolor: '#A0693A' } }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Reveal>
  );
}
