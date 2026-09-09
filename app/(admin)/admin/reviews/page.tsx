'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Rating, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  Skeleton, Avatar, Switch,
} from '@mui/material';
import { Delete, CheckCircle, Cancel } from '@mui/icons-material';
import { reviewApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import { toast } from 'react-hot-toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const rowsPerPage = 20;

  const fetchReviews = useCallback(() => {
    setLoading(true);
    reviewApi.getAll({ page: page + 1, limit: rowsPerPage })
      .then(({ data }) => { setReviews(data.data || []); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async (review: any) => {
    const next = !review.isApproved;
    try {
      await reviewApi.update(review.id, { isApproved: next });
      toast.success(next ? 'Review approved' : 'Review unapproved');
      fetchReviews();
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await reviewApi.delete(id);
      toast.success('Deleted');
      fetchReviews();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}>Reviews</Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Customer', 'Product', 'Rating', 'Review', 'Date', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [...Array(8)].map((_, i) => (
                <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : reviews.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={r.user?.avatar} sx={{ width: 28, height: 28, fontSize: 11 }}>
                        {r.user?.firstName?.[0]}
                      </Avatar>
                      <Typography variant="caption">{r.user?.firstName} {r.user?.lastName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 140, display: 'block' }}>
                      {r.product?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Rating value={r.rating} size="small" readOnly sx={{ fontSize: 14 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.body || r.comment}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.isApproved ? 'Approved' : 'Pending'}
                      size="small" color={r.isApproved ? 'success' : 'warning'}
                      sx={{ fontSize: '0.6rem', fontWeight: 700, height: 20 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color={r.isApproved ? 'warning' : 'success'} onClick={() => handleApprove(r)}>
                      {r.isApproved ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div" count={total} page={page} rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
            onPageChange={(_, p) => setPage(p)}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
