import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Box, Typography, Container } from '@mui/material';
import { API_URL } from '@/constants';

interface Props {
  params: Promise<{ page: string }>;
}

async function fetchCmsPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/cms/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: slug } = await params;
  const page = await fetchCmsPage(slug);
  if (!page) return { title: 'Page Not Found' };
  return {
    title: page.seoMeta?.metaTitle || `${page.title} — Unique Dressup`,
    description: page.seoMeta?.metaDescription || page.excerpt,
  };
}

export default async function CmsPage({ params }: Props) {
  const { page: slug } = await params;
  const page = await fetchCmsPage(slug);
  if (!page) notFound();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 4 }}>
        {page.title}
      </Typography>
      <Box
        dangerouslySetInnerHTML={{ __html: page.content }}
        sx={{
          '& h2': { fontFamily: 'var(--font-playfair)', fontWeight: 700, mt: 4, mb: 1.5, fontSize: '1.6rem' },
          '& h3': { fontWeight: 700, mt: 3, mb: 1 },
          '& p': { mb: 2, lineHeight: 1.8, color: '#333' },
          '& ul, & ol': { mb: 2, pl: 3 },
          '& li': { mb: 0.5, lineHeight: 1.7 },
          '& a': { color: '#c9a84c' },
          '& strong': { fontWeight: 700 },
          '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
          '& th, & td': { border: '1px solid #eee', p: 1.5, textAlign: 'left' },
        }}
      />
    </Container>
  );
}
