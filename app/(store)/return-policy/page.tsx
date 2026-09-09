import type { Metadata } from 'next';
import { Box, Container, Typography, Divider, Grid } from '@mui/material';
import { Timer, Videocam, CardGiftcard, SwapHoriz, Instagram } from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'Return & Exchange Policy | Unique Dressup',
  description:
    'Return requests within 36 hours of delivery for wrong or damaged products, store credit refunds, and size exchanges — how it works at The Unique Dressup.',
};

const LAST_UPDATED = 'September 1, 2026';
const INSTAGRAM_HANDLE = '@uniquedressup.inn';
const INSTAGRAM_URL = 'https://www.instagram.com/uniquedressup.inn';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: '#1a1a1a' }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.9, mb: 1.5 }}>
    {children}
  </Typography>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <Typography component="li" variant="body2" sx={{ color: '#444', lineHeight: 1.9, mb: 0.5, pl: 1 }}>
    {children}
  </Typography>
);

const IgLink = () => (
  <Box
    component="a"
    href={INSTAGRAM_URL}
    target="_blank"
    rel="noopener noreferrer"
    sx={{ color: '#c9a84c', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
  >
    {INSTAGRAM_HANDLE}
  </Box>
);

const highlights = [
  { icon: <Timer sx={{ fontSize: 28, color: '#c9a84c' }} />, title: '36-Hour Window', desc: 'Raise a request within 36 hours of delivery' },
  { icon: <Videocam sx={{ fontSize: 28, color: '#c9a84c' }} />, title: 'Unboxing Video', desc: 'Mandatory for every claim' },
  { icon: <CardGiftcard sx={{ fontSize: 28, color: '#c9a84c' }} />, title: 'Store Credit', desc: 'Issued for all eligible returns' },
  { icon: <SwapHoriz sx={{ fontSize: 28, color: '#c9a84c' }} />, title: 'Size Exchange', desc: '₹200 round-trip courier handling' },
];

export default function ReturnPolicyPage() {
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
            Return &amp; Exchange Policy
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Last updated: {LAST_UPDATED}
          </Typography>
        </Container>
      </Box>

      {/* Highlights */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            {highlights.map((h) => (
              <Grid item xs={6} sm={3} key={h.title}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 1 }}>{h.icon}</Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>{h.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>{h.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: { xs: 3, md: 5 } }}>

          <P>
            At The Unique Dressup, we are committed to making your shopping experience smooth and
            hassle-free. We carefully check and pack every order before dispatch, but if you face an
            issue with your order, our team is always here to assist you.
          </P>

          {/* Unboxing video callout — the one thing every claim depends on */}
          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: '#fdf8ec',
              border: '1px solid',
              borderColor: '#e8d9a8',
              display: 'flex',
              gap: 1.75,
              alignItems: 'flex-start',
            }}
          >
            <Videocam sx={{ fontSize: 22, color: '#c9a84c', mt: '2px', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>
                Please record your unboxing
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a5a5a', lineHeight: 1.8 }}>
                A complete, uninterrupted unboxing video is required for us to verify and resolve any
                genuine issue related to a missing, wrong, or damaged product. Start recording before you
                open the outer packaging.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Section title="1. Return Eligibility">
            <P>
              All return or complaint requests must be raised within{' '}
              <strong>36 hours of delivery</strong>.
            </P>
            <P>Returns are accepted only in the following cases:</P>
            <Box component="ul" sx={{ pl: 3, m: 0, mb: 1.5 }}>
              <Li>Wrong product received</Li>
              <Li>Damaged product received</Li>
            </Box>
            <P>
              We take the utmost care to maintain the quality of every product and to ensure that your
              order reaches you in the best possible condition.
            </P>
            <P>
              <strong>Please note:</strong> any return or complaint raised after the specified timeline
              cannot be accepted.
            </P>
          </Section>

          <Section title="2. Unboxing Video Requirement">
            <P>A clear and continuous unboxing video is mandatory for raising a claim regarding:</P>
            <Box component="ul" sx={{ pl: 3, m: 0, mb: 1.5 }}>
              <Li>Missing items</Li>
              <Li>Wrong product received</Li>
              <Li>Damaged product received</Li>
            </Box>
            <P>
              The video must be recorded from start to finish without any cuts or editing, beginning from
              the moment you open the outer packaging.
            </P>
            <P>
              If the parcel appears damaged or tampered with on delivery, the unboxing video also allows
              us to raise the issue with our courier partner on your behalf.
            </P>
          </Section>

          <Section title="3. Refunds — Store Credit">
            <P>
              For eligible returns, <strong>only store credit will be provided</strong>. We do not offer
              direct bank refunds.
            </P>
          </Section>

          <Section title="4. Return Process">
            <P>
              To initiate a return, contact us on Instagram at <IgLink />.
            </P>
            <P>
              Our team will review your request and, once approved, arrange a return pickup wherever the
              service is available.
            </P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li>A maximum of <strong>2 pickup attempts</strong> will be made</Li>
              <Li>
                If your PIN code is in a non-serviceable pickup area, you will need to self-ship the
                product to our warehouse
              </Li>
            </Box>
          </Section>

          <Section title="5. Exchange Policy — Size Issues">
            <P>
              We understand that choosing the right size online can sometimes be difficult. Size exchanges
              are available if you need a different size.
            </P>
            <P>
              To initiate an exchange, DM us on Instagram at <IgLink /> with your order details.
            </P>
            <P>
              A <strong>₹200 charge</strong> applies towards round-trip courier handling, including pickup
              and re-delivery. This charge is collected towards logistics services and is not retained by
              The Unique Dressup. As an affordable fashion brand operating with tight margins, we
              currently do not offer free size exchanges.
            </P>
            <P>
              Once we receive the returned product it undergoes a quality check. If it meets our exchange
              conditions, your requested size is dispatched.
            </P>
            <P>
              Products showing signs of wear, use, washing, alteration, stains, or customer-caused damage
              are not eligible for exchange.
            </P>
          </Section>

          <Section title="6. Exchange Pick-Up Charges">
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li>₹200 for the exchange of up to 2 products in a single pickup</Li>
              <Li>₹50 additional for every extra product included in the same exchange request</Li>
              <Li>
                No return or exchange fee is charged if the exchange is due to a wrong or damaged product
                received from our end
              </Li>
            </Box>
          </Section>

          <Section title="7. Contact Us">
            <P>For all return and exchange queries, please reach out to us on Instagram:</P>
            <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 1.5, p: 2.5, mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#444', fontWeight: 700, mb: 0.75 }}>
                The Unique Dressup — Customer Support
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Instagram sx={{ fontSize: 18, color: '#c9a84c' }} />
                <Typography variant="body2" sx={{ color: '#444' }}>
                  Instagram: <IgLink />
                </Typography>
              </Box>
            </Box>
            <P>
              <Box component="span" sx={{ display: 'block', mt: 2 }}>
                Thank you for shopping with us.
              </Box>
            </P>
          </Section>

        </Box>
      </Container>
    </Box>
  );
}
