import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Container, Typography, Divider } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Unique Dressup',
  description:
    'Answers to common questions about orders, shipping charges and timelines, payments, returns, and size exchanges at The Unique Dressup.',
};

const LAST_UPDATED = 'September 1, 2026';
const INSTAGRAM_URL = 'https://www.instagram.com/uniquedressup.inn';

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Box
    component={Link}
    href={href}
    sx={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
  >
    {children}
  </Box>
);

const Ig = () => (
  <Box
    component="a"
    href={INSTAGRAM_URL}
    target="_blank"
    rel="noopener noreferrer"
    sx={{ color: '#c9a84c', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
  >
    @uniquedressup.inn
  </Box>
);

const Qa = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 3.5 }}>
    <Typography variant="body1" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.75 }}>
      {q}
    </Typography>
    <Typography variant="body2" component="div" sx={{ color: '#444', lineHeight: 1.9 }}>
      {children}
    </Typography>
  </Box>
);

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 5 }}>
    <Typography
      variant="overline"
      sx={{ color: '#c9a84c', letterSpacing: '0.18em', fontWeight: 700, display: 'block', mb: 2.5 }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

export default function FaqPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: '#1a1a1a', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
          >
            Customer Support
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 1.5 }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Last updated: {LAST_UPDATED}
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: { xs: 3, md: 5 } }}>

          <Group title="Orders">
            <Qa q="How soon is my order dispatched?">
              Orders are processed and dispatched within <strong>1–2 business days</strong>. You will
              receive tracking details once the parcel leaves our warehouse.
            </Qa>
            <Qa q="When will my order arrive?">
              After dispatch, delivery typically takes 3–5 business days to metro cities, 5–7 business
              days to tier 2 and 3 cities, and 7–10 business days to remote areas. Express Delivery
              arrives in 1–2 business days on serviceable pin codes.
            </Qa>
            <Qa q="How do I track my order?">
              Sign in and open <A href="/account/orders">My Orders</A>, where you will find the current
              status and tracking link for every order.
            </Qa>
            <Qa q="Can I cancel my order?">
              Yes — while the order is still pending or confirmed, open it in{' '}
              <A href="/account/orders">My Orders</A> and use <strong>Cancel Order</strong>. Once the
              parcel has been dispatched it can no longer be cancelled; message us on Instagram at{' '}
              <Ig /> and we will help where we can.
            </Qa>
          </Group>

          <Divider sx={{ mb: 5 }} />

          <Group title="Shipping & Payment">
            <Qa q="What are the shipping charges?">
              Standard Delivery is ₹79 (5–7 business days), Cash on Delivery is ₹149 (5–7 business days),
              and Express Delivery is ₹249 (1–2 business days, on select pin codes). Full details are in
              our <A href="/shipping-policy">Shipping Policy</A>.
            </Qa>
            <Qa q="How does Cash on Delivery work?">
              The ₹149 delivery charge is paid online when you place the order. The product amount is
              paid to the courier on delivery.
            </Qa>
            <Qa q="Which payment methods do you accept?">
              We accept UPI, debit and credit cards, and net banking through our payment partners
              Razorpay and Cashfree, as well as Cash on Delivery.
            </Qa>
            <Qa q="What if nobody is home when the courier arrives?">
              Our logistics partners attempt delivery up to <strong>3 times</strong>. Please make sure
              your address and phone number are complete and correct, as an incomplete address is the
              most common cause of a delayed or returned parcel.
            </Qa>
          </Group>

          <Divider sx={{ mb: 5 }} />

          <Group title="Returns & Exchanges">
            <Qa q="Can I return something I simply did not like?">
              No. Returns are accepted only where a <strong>wrong or damaged product</strong> was
              received, and the request must be raised within <strong>36 hours of delivery</strong>. If
              the size is the problem, see the exchange questions below.
            </Qa>
            <Qa q="Why is an unboxing video required?">
              A clear, continuous unboxing video is the only way we can verify a claim for a missing,
              wrong, or damaged item — and it is what lets us take the matter up with our courier
              partner. Start recording <strong>before</strong> you open the outer packaging and do not
              cut or edit the video.
            </Qa>
            <Qa q="Do I get my money back?">
              Eligible returns are settled in <strong>store credit</strong>. We do not offer direct bank
              refunds.
            </Qa>
            <Qa q="I ordered the wrong size. What can I do?">
              Size exchanges are available. DM us on Instagram at <Ig /> with your order details. A ₹200
              charge covers round-trip courier handling for up to 2 products, plus ₹50 for each
              additional product in the same request. Nothing is charged when the exchange is due to a
              wrong or damaged product sent by us.
            </Qa>
            <Qa q="How do I raise a return or exchange?">
              Message us on Instagram at <Ig />. Our team reviews the request and arranges a pickup where
              the service is available — up to 2 attempts. If your PIN code is not serviceable for
              pickup, you will need to self-ship the item to our warehouse. The full terms are in our{' '}
              <A href="/return-policy">Return &amp; Exchange Policy</A>.
            </Qa>
          </Group>

          <Divider sx={{ mb: 4 }} />

          {/* Still stuck */}
          <Box
            sx={{
              p: 3,
              borderRadius: 1.5,
              bgcolor: '#fdf8ec',
              border: '1px solid',
              borderColor: '#e8d9a8',
              display: 'flex',
              gap: 1.75,
              alignItems: 'flex-start',
            }}
          >
            <HelpOutline sx={{ fontSize: 22, color: '#c9a84c', mt: '2px', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>
                Still need help?
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a5a5a', lineHeight: 1.8 }}>
                Message us on Instagram at <Ig /> with your order number, or use our{' '}
                <A href="/contact">contact page</A>. We are happy to help.
              </Typography>
            </Box>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}
