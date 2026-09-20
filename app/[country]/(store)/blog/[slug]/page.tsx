import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Box, Typography, Chip, Divider, Avatar } from '@mui/material';
import { formatDate } from '../../../../../utils/format';
import { API_URL, SITE_NAME } from '../../../../../constants';
import { normalizeBlog } from '../../../../../lib/blog';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

async function fetchBlog(slug: string) {
  try {
    const res = await fetch(`${API_URL}/blogs/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return normalizeBlog((await res.json()).data);
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const blog = await fetchBlog(slug);
  if (!blog) return { title: 'Article Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/blog/${blog.slug}`, country, countries);
  return {
    title: (blog.seoMeta?.metaTitle || blog.title).replace(/\s*[|—–-]\s*(The )?Wood Vintage\s*$/i, ''),
    description: blog.seoMeta?.metaDescription || blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : [],
      type: 'article',
      url: alt.canonical,
    },
    alternates: alt,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const blog = await fetchBlog(slug);
  if (!blog) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage ? [blog.coverImage] : undefined,
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
    author: blog.author
      ? { '@type': 'Person', name: `${blog.author.firstName} ${blog.author.lastName}`.trim() }
      : { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
      <Box sx={{ mb: 4 }}>
        {blog.category && (
          <Chip label={blog.category} size="small"
            sx={{ mb: 2, bgcolor: '#F6EEDF', color: '#A0693A', fontWeight: 700 }} />
        )}
        <Typography variant="h2" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 2, lineHeight: 1.25 }}>
          {blog.title}
        </Typography>
        {blog.excerpt && (
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 3, lineHeight: 1.6 }}>
            {blog.excerpt}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {blog.author ? (
            <>
              <Avatar src={blog.author.avatar} sx={{ width: 36, height: 36 }}>
                {blog.author.firstName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>{blog.author.firstName} {blog.author.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(blog.publishedAt || blog.createdAt)}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {formatDate(blog.publishedAt || blog.createdAt)}
            </Typography>
          )}
        </Box>
      </Box>

      {blog.coverImage && (
        <Box component="img" src={blog.coverImage} alt={blog.title}
          sx={{ width: '100%', height: { xs: 220, md: 420 }, objectFit: 'cover', borderRadius: 2, mb: 4 }} />
      )}

      <Divider sx={{ mb: 4 }} />

      <Box
        dangerouslySetInnerHTML={{ __html: blog.content }}
        sx={{
          '& h2': { fontFamily: 'var(--font-playfair)', fontWeight: 700, mt: 4, mb: 1.5, fontSize: '1.75rem' },
          '& h3': { fontFamily: 'var(--font-playfair)', fontWeight: 700, mt: 3, mb: 1, fontSize: '1.35rem' },
          '& p': { mb: 2, lineHeight: 1.8, color: '#333' },
          '& ul, & ol': { mb: 2, pl: 3 },
          '& li': { mb: 0.5, lineHeight: 1.7 },
          '& img': { width: '100%', borderRadius: 2, my: 3 },
          '& blockquote': {
            borderLeft: '4px solid #A0693A', pl: 2, py: 0.5, my: 3,
            bgcolor: '#F6EEDF', borderRadius: '0 8px 8px 0',
          },
          '& a': { color: '#A0693A', textDecoration: 'underline' },
        }}
      />
    </Box>
    </>
  );
}
