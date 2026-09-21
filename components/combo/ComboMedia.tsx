'use client';
import Image from 'next/image';
import { Box } from '@mui/material';
import type { Combo } from '../../types';

/**
 * The combo's own picture, or (when the admin hasn't uploaded one) a tidy
 * collage of its first products, so a card is never an empty grey box.
 */
export default function ComboMedia({ combo, sizes, priority = false }: { combo: Pick<Combo, 'image' | 'name' | 'items'>; sizes: string; priority?: boolean }) {
  if (combo.image) {
    return <Image src={combo.image} alt={combo.name} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />;
  }
  const shots = combo.items.map((i) => i.image).filter(Boolean).slice(0, 4) as string[];
  return (
    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: shots.length > 1 ? '1fr 1fr' : '1fr', gap: '2px', bgcolor: '#e8dfd0' }}>
      {shots.map((src, i) => (
        <Box key={i} sx={{ position: 'relative' }}>
          <Image src={src} alt="" fill sizes={sizes} style={{ objectFit: 'cover' }} />
        </Box>
      ))}
    </Box>
  );
}
