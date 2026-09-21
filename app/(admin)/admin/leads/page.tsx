'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination, Skeleton,
  Drawer, Divider, Stack, InputAdornment,
} from '@mui/material';
import { Close, WhatsApp, Phone, MailOutline, Download, Search, InboxOutlined } from '@mui/icons-material';
import { leadApi } from '../../../../services/api.service';
import { formatDateTime } from '../../../../utils/format';
import { toast } from 'react-hot-toast';

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'] as const;
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  NEW:       { bg: '#fdecc8', fg: '#7a5200' },
  CONTACTED: { bg: '#dbe9f8', fg: '#1c4f86' },
  QUOTED:    { bg: '#ece0f5', fg: '#5b2f80' },
  WON:       { bg: '#d7efdc', fg: '#1e6b34' },
  LOST:      { bg: '#eee',    fg: '#666' },
};
const th = { fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' } as const;

const StatusChip = ({ status }: { status: string }) => (
  <Chip label={status} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, height: 22, bgcolor: STATUS_COLOR[status]?.bg, color: STATUS_COLOR[status]?.fg }} />
);

export default function LeadsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const rowsPerPage = 20;

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(0); }, 350); return () => clearTimeout(t); }, [search]);

  const params = useCallback(() => ({
    ...(status && { status }), ...(q && { search: q }),
    ...(startDate && { startDate }), ...(endDate && { endDate }),
  }), [status, q, startDate, endDate]);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    leadApi.getAll({ page: page + 1, limit: rowsPerPage, ...params() })
      .then(({ data }) => { setItems(data.data || []); setTotal(data.meta?.total || 0); })
      .catch(() => toast.error('Could not load leads'))
      .finally(() => setLoading(false));
  }, [page, params]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const open = (lead: any) => { setSelected(lead); setNotes(lead.notes || ''); };

  const patch = async (data: object) => {
    if (!selected) return;
    setSaving(true);
    try {
      const { data: res } = await leadApi.update(selected.id, data);
      setSelected(res.data);
      setItems((prev) => prev.map((l) => (l.id === res.data.id ? res.data : l)));
      toast.success('Lead updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const exportCsv = async () => {
    try {
      const res = await leadApi.exportCsv(params());
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const digits = (p: string) => p.replace(/\D/g, '');

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Leads</Typography>
        <Button variant="outlined" startIcon={<Download />} onClick={exportCsv} sx={{ color: '#3B2314', borderColor: '#3B2314' }}>Export CSV</Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField size="small" placeholder="Search name, phone, email, product" value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
            <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 150 }}>
              <MenuItem value="">All</MenuItem>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField size="small" type="date" label="From" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" type="date" label="To" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>{['Received', 'Customer', 'Product', 'Room / style', 'Campaign', 'Status'].map((h) => <TableCell key={h} sx={th}>{h}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>
                {loading ? [...Array(8)].map((_, i) => (
                  <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                )) : items.map((l) => (
                  <TableRow key={l.id} hover onClick={() => open(l)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{l.name}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{l.phone}</Typography>
                    </TableCell>
                    <TableCell><Typography noWrap sx={{ fontSize: '0.78rem', maxWidth: 180 }}>{l.productName || '-'}</Typography></TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{[l.room, l.style].filter(Boolean).join(' / ') || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{[l.utmSource, l.utmCampaign].filter(Boolean).join(' / ') || 'direct'}</TableCell>
                    <TableCell><StatusChip status={l.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {!loading && items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <InboxOutlined sx={{ fontSize: 44, color: '#c9b8a6' }} />
              <Typography sx={{ fontWeight: 700, mt: 1 }}>{status || q || startDate || endDate ? 'No leads match these filters' : 'No leads yet'}</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {status || q || startDate || endDate ? 'Try clearing a filter.' : 'Quote requests from product pages will appear here.'}
              </Typography>
            </Box>
          )}

          <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[rowsPerPage]} onPageChange={(_, p) => setPage(p)} />
        </CardContent>
      </Card>

      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
        {selected && (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selected.name}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Received {formatDateTime(selected.createdAt)}</Typography>
              </Box>
              <IconButton aria-label="Close" onClick={() => setSelected(null)}><Close /></IconButton>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" startIcon={<WhatsApp />} component="a" target="_blank" rel="noopener noreferrer"
                href={`https://wa.me/${digits(selected.phone)}?text=${encodeURIComponent(`Hi ${selected.name.split(' ')[0]}, this is The Wood Vintage about your enquiry${selected.productName ? ` for ${selected.productName}` : ''}.`)}`}
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C4A' } }}>WhatsApp</Button>
              <Button size="small" variant="outlined" startIcon={<Phone />} component="a" href={`tel:${selected.phone}`}>Call</Button>
              <Button size="small" variant="outlined" startIcon={<MailOutline />} component="a" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Your enquiry${selected.productName ? `: ${selected.productName}` : ''}`)}`}>Email</Button>
            </Stack>

            <Divider />
            <TextField select size="small" label="Status" value={selected.status} disabled={saving} onChange={(e) => patch({ status: e.target.value })}>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 0.75, fontSize: '0.83rem' }}>
              {([
                ['Phone', selected.phone], ['Email', selected.email], ['Prefers', selected.preferredContact],
                ['Product', selected.productName || '-'], ['Room', selected.room || '-'], ['Style', selected.style || '-'],
                ['Needs', selected.requirement || '-'],
                ['Campaign', [selected.utmSource, selected.utmMedium, selected.utmCampaign].filter(Boolean).join(' / ') || 'direct'],
                ['Consent', selected.consentAt ? `Given ${formatDateTime(selected.consentAt)}` : 'No'],
              ] as [string, string][]).map(([k, v]) => (
                <Box key={k} sx={{ display: 'contents' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>{k}</Typography>
                  <Typography sx={{ fontSize: '0.83rem', wordBreak: 'break-word' }}>{v}</Typography>
                </Box>
              ))}
            </Box>
            {selected.pageUrl && (
              <Typography component="a" href={selected.pageUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.75rem', color: '#A0693A', wordBreak: 'break-all' }}>
                View the page they enquired from
              </Typography>
            )}

            <Divider />
            <TextField label="Internal notes" multiline minRows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button variant="contained" disabled={saving || notes === (selected.notes || '')} onClick={() => patch({ notes })}
              sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#A0693A' } }}>
              {saving ? 'Saving...' : 'Save notes'}
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
