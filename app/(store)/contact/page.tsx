'use client';
import { useState } from 'react';
import {
  Box, Container, Typography, Grid, TextField, Button,
  CircularProgress, Alert, Card, CardContent,
} from '@mui/material';
import { Email, Phone, AccessTime, LocationOn } from '@mui/icons-material';

const contactInfo = [
  {
    icon: <Email sx={{ fontSize: 24, color: '#c9a84c' }} />,
    label: 'Email',
    value: 'support@theuniquedressup.com',
    href: 'mailto:support@theuniquedressup.com',
  },
  {
    icon: <Phone sx={{ fontSize: 24, color: '#c9a84c' }} />,
    label: 'Phone',
    value: '+91 XXXXX XXXXX',
    href: 'tel:+91XXXXXXXXXX',
  },
  {
    icon: <AccessTime sx={{ fontSize: 24, color: '#c9a84c' }} />,
    label: 'Support Hours',
    value: 'Mon–Sat, 10 AM – 6 PM IST',
    href: null,
  },
  {
    icon: <LocationOn sx={{ fontSize: 24, color: '#c9a84c' }} />,
    label: 'Location',
    value: 'India',
    href: null,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('loading');
    // Simulate submission — wire up to your backend /api/v1/contact when ready
    await new Promise(r => setTimeout(r, 1200));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: '#1a1a1a', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
          >
            Get in Touch
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 1.5 }}
          >
            Contact Us
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            We're here to help. Reach out to us with any questions or concerns.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={5}>

          {/* Contact info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', mb: 3 }}>
              Reach Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contactInfo.map((item) => (
                <Card
                  key={item.label}
                  elevation={0}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ mt: 0.25 }}>{item.icon}</Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {item.label}
                      </Typography>
                      {item.href ? (
                        <Typography
                          component="a"
                          href={item.href}
                          variant="body2"
                          sx={{ color: '#1a1a1a', textDecoration: 'none', display: 'block', mt: 0.25, '&:hover': { color: '#c9a84c' } }}
                        >
                          {item.value}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.25 }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ mt: 3, p: 2.5, bgcolor: '#fff8f0', borderRadius: 2, border: '1px solid #ed6c02' }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#ed6c02', mb: 0.5 }}>
                Order Support
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                For order-related queries, please include your order number in the subject line.
                Our team typically responds within 4–6 business hours.
              </Typography>
            </Box>
          </Grid>

          {/* Contact form */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                bgcolor: 'white', borderRadius: 2,
                border: '1px solid', borderColor: 'divider', p: { xs: 3, md: 4 },
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', mb: 3 }}>
                Send a Message
              </Typography>

              {status === 'success' && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Thank you for reaching out! We'll get back to you within 4–6 business hours.
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="name"
                      label="Full Name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="email"
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="subject"
                      label="Subject"
                      value={form.subject}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      placeholder="e.g. Order #UD12345 — Missing item"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="message"
                      label="Message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      fullWidth
                      multiline
                      rows={5}
                      size="small"
                      placeholder="Describe your issue or question in detail..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={status === 'loading'}
                      sx={{
                        bgcolor: '#1a1a1a', color: 'white', px: 4, py: 1.25,
                        fontWeight: 700, letterSpacing: '0.08em',
                        '&:hover': { bgcolor: '#333' },
                      }}
                    >
                      {status === 'loading'
                        ? <CircularProgress size={20} sx={{ color: 'white' }} />
                        : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
