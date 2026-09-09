'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Box, Container, Typography, Avatar, Rating, Card, CardContent } from '@mui/material';
import { FormatQuote } from '@mui/icons-material';
import { motion } from 'framer-motion';

import 'swiper/css';
import 'swiper/css/pagination';

interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  review: string;
  designation?: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials.length) return null;

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#0d0d0d' }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Typography variant="overline" sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}>
              Testimonials
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white' }}>
              What Our Customers Say
            </Typography>
          </Box>
        </motion.div>

        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          touchStartPreventDefault={false}
          style={{ paddingBottom: 48 }}
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.id}>
              <Card elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FormatQuote sx={{ color: '#c9a84c', fontSize: 32, transform: 'scaleX(-1)', mb: 1 }} />
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, flexGrow: 1, mb: 3, fontStyle: 'italic' }}>
                    "{t.review}"
                  </Typography>
                  <Rating value={t.rating} readOnly size="small" sx={{ mb: 2, '& .MuiRating-iconFilled': { color: '#c9a84c' } }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={t.avatar} sx={{ width: 40, height: 40, bgcolor: '#c9a84c', fontSize: '0.85rem', fontWeight: 700 }}>
                      {t.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
                        {t.name}
                      </Typography>
                      {t.designation && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {t.designation}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Box>
  );
}
