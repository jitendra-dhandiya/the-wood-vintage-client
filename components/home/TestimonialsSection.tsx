'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Box, Container, Typography, Rating } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import { buildImageUrl } from '../../lib/imageUrl';
import { C, SERIF, SectionHead } from './craft/shared';

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
  title?: string;
  /** Light wood-grain background (a lightened real photo). */
  texture?: string;
}

export default function TestimonialsSection({ testimonials, title, texture }: TestimonialsSectionProps) {
  const reduce = useReducedMotion();
  if (!testimonials.length) return null;

  return (
    <Box sx={{
      py: { xs: 7, md: 11 }, bgcolor: C.sand,
      backgroundImage: texture ? `url(${buildImageUrl(texture, 1440)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center',
      '& .swiper-pagination-bullet-active': { bgcolor: C.copper },
    }}>
      <Container maxWidth="xl">
        <SectionHead align="center" eyebrow="Testimonials" title={title || 'Kind words from our customers'} />
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={reduce ? false : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true }}
          breakpoints={{ 700: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }}
          touchStartPreventDefault={false}
          style={{ paddingBottom: 52, paddingTop: 10 }}
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.id} style={{ height: 'auto' }}>
              <Box component="figure" sx={{ m: 0, height: '100%', p: { xs: 3, md: 4 }, bgcolor: 'rgba(255,252,245,0.94)', border: '1px solid rgba(59,35,20,0.1)', borderRadius: '3px', boxShadow: '0 22px 40px -30px rgba(42,25,14,0.55)', display: 'flex', flexDirection: 'column' }}>
                <Typography aria-hidden sx={{ fontFamily: SERIF, color: C.copper, fontSize: '4.5rem', lineHeight: 0.7, height: 34 }}>&ldquo;</Typography>
                <Typography component="blockquote" sx={{ m: 0, fontFamily: SERIF, color: C.walnut, fontSize: { xs: '1.3rem', md: '1.45rem' }, lineHeight: 1.45, fontWeight: 500, flexGrow: 1, mb: 3 }}>
                  {t.review}
                </Typography>
                <Rating value={t.rating} readOnly size="small" sx={{ mb: 1.5, '& .MuiRating-iconFilled': { color: C.copper } }} />
                <Box component="figcaption" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: C.walnut, color: C.gold, display: 'grid', placeItems: 'center', fontFamily: SERIF, fontSize: '1.2rem', flexShrink: 0 }}>{t.name.charAt(0)}</Box>
                  <Box>
                    <Typography sx={{ color: C.walnut, fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.2 }}>{t.name}</Typography>
                    {t.designation && <Typography sx={{ color: '#7a6450', fontSize: '0.8rem' }}>{t.designation}</Typography>}
                  </Box>
                </Box>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Box>
  );
}
