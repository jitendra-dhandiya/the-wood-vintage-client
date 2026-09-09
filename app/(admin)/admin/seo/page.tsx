'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Skeleton, Accordion, AccordionSummary, AccordionDetails, Chip,
  TablePagination, InputAdornment,
} from '@mui/material';
import { ExpandMore, Search } from '@mui/icons-material';
import { seoApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 20;

export default function SeoPage() {
  const [seoMetas, setSeoMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSeo = useCallback(() => {
    setLoading(true);
    seoApi.getAll({ page: page + 1, limit: PAGE_SIZE, search: search || undefined })
      .then(({ data }) => {
        const d = data as any;
        setSeoMetas(d.data || []);
        setTotal(d.meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchSeo, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchSeo, search]);

  const getEdit = (meta: any) => edits[meta.id] || {
    metaTitle: meta.metaTitle || '',
    metaDesc: meta.metaDesc || '',
    metaKeywords: meta.metaKeywords || '',
    ogTitle: meta.ogTitle || '',
    ogDesc: meta.ogDesc || '',
    canonicalUrl: meta.canonicalUrl || '',
  };

  const setEdit = (id: string, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...getEdit({ id, ...prev[id] }), [field]: value } }));

  const save = async (meta: any) => {
    setSaving(meta.id);
    try {
      await seoApi.update(meta.id, getEdit(meta));
      toast.success('SEO updated');
      fetchSeo();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(null);
    }
  };

  const grouped: Record<string, any[]> = {};
  seoMetas.forEach(m => {
    const type = m.page?.split('/')?.[0]?.toUpperCase() || 'OTHER';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(m);
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>SEO Manager</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage meta titles, descriptions, and Open Graph tags for all pages.
      </Typography>

      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search pages..." sx={{ width: 280 }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
      </Box>

      {loading ? (
        <Box>{[...Array(5)].map((_, i) => <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 1 }} />)}</Box>
      ) : (
        <>
          {Object.entries(grouped).map(([type, metas]) => (
            <Box key={type} sx={{ mb: 2 }}>
              <Typography variant="overline" fontWeight={700} color="text.secondary">{type}</Typography>
              {metas.map(meta => {
                const e = getEdit(meta);
                return (
                  <Accordion key={meta.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="body2" fontWeight={600}>{e.metaTitle || meta.page || 'Untitled'}</Typography>
                        <Chip label={meta.page} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField label="Meta Title" size="small" fullWidth value={e.metaTitle}
                            onChange={ev => setEdit(meta.id, 'metaTitle', ev.target.value)}
                            helperText={`${(e.metaTitle || '').length}/60 chars`} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Meta Description" size="small" fullWidth multiline rows={2}
                            value={e.metaDesc}
                            onChange={ev => setEdit(meta.id, 'metaDesc', ev.target.value)}
                            helperText={`${(e.metaDesc || '').length}/160 chars`} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Keywords (comma separated)" size="small" fullWidth
                            value={e.metaKeywords}
                            onChange={ev => setEdit(meta.id, 'metaKeywords', ev.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="OG Title" size="small" fullWidth value={e.ogTitle}
                            onChange={ev => setEdit(meta.id, 'ogTitle', ev.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Canonical URL" size="small" fullWidth value={e.canonicalUrl}
                            onChange={ev => setEdit(meta.id, 'canonicalUrl', ev.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="OG Description" size="small" fullWidth multiline rows={2}
                            value={e.ogDesc}
                            onChange={ev => setEdit(meta.id, 'ogDesc', ev.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                          <Button variant="contained" size="small" onClick={() => save(meta)}
                            disabled={saving === meta.id}
                            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
                            {saving === meta.id ? 'Saving...' : 'Save'}
                          </Button>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          ))}

          {seoMetas.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>No SEO entries found</Typography>
          )}

          <TablePagination
            component="div" count={total} page={page} rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            onPageChange={(_, p) => setPage(p)}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </Box>
  );
}
