import type { Metadata } from 'next';
import { Box, Container, Typography, Divider, Grid, Chip } from '@mui/material';
import { LocalShipping, FlashOn, AttachMoney } from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'Shipping Policy | Unique Dressup',
  description: 'Learn about our shipping methods, delivery timelines, and charges at Unique Dressup.',
};

const LAST_UPDATED = 'June 1, 2025';

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

const shippingOptions = [
  {
    icon: <LocalShipping sx={{ fontSize: 28, color: '#c9a84c' }} />,
    name: 'Standard Delivery',
    charge: '₹79',
    days: '5–7 Business Days',
    desc: 'Reliable delivery at a great price',
  },
  {
    icon: <AttachMoney sx={{ fontSize: 28, color: '#c9a84c' }} />,
    name: 'Cash on Delivery',
    charge: '₹149',
    days: '5–7 Business Days',
    desc: 'Pay ₹149 online + product amount on delivery',
  },
  {
    icon: <FlashOn sx={{ fontSize: 28, color: '#c9a84c' }} />,
    name: 'Express Delivery',
    charge: '₹249',
    days: '1–2 Business Days',
    desc: 'Fastest delivery option available',
  },
];

export default function ShippingPolicyPage() {
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
            Shipping Policy
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Last updated: {LAST_UPDATED}
          </Typography>
        </Container>
      </Box>

      {/* Shipping options cards */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {shippingOptions.map((opt) => (
              <Grid item xs={12} sm={4} key={opt.name}>
                <Box sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  p: 3, textAlign: 'center', height: '100%',
                }}>
                  <Box sx={{ mb: 1.5 }}>{opt.icon}</Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>
                    {opt.name}
                  </Typography>
                  <Chip label={opt.charge} size="small" sx={{ bgcolor: '#1a1a1a', color: 'white', mb: 1 }} />
                  <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>
                    {opt.days}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#aaa' }}>{opt.desc}</Typography>
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
            We ship to all pin codes across India. Our goal is to deliver your order safely and on time.
            Please read this Shipping Policy to understand our delivery options, timelines, and charges.
          </P>

          <Divider sx={{ my: 4 }} />

          <Section title="1. Shipping Methods & Charges">
            <P>
              We offer three shipping options. The charge displayed at checkout applies to your order.
              Individual products may have custom shipping rates set by our team — if so, the product rate
              overrides the global rate.
            </P>
            <Box component="ul" sx={{ pl: 3, m: 0, mb: 1.5 }}>
              <Li><strong>Standard Delivery (₹79):</strong> 5–7 business days. Best for non-urgent orders.</Li>
              <Li><strong>Cash on Delivery (₹149):</strong> 5–7 business days. Delivery charge paid online; product amount paid on delivery.</Li>
              <Li><strong>Express Delivery (₹249):</strong> 1–2 business days. Available for select pin codes.</Li>
            </Box>
            <P>
              For orders with multiple products, the highest applicable shipping charge among all items applies.
            </P>
          </Section>

          <Section title="2. Order Processing Time">
            <P>
              Orders are processed on business days (Monday–Saturday, excluding public holidays).
              Orders placed before 2:00 PM IST are typically processed the same day. Orders placed after
              2:00 PM IST or on weekends/holidays are processed on the next business day.
            </P>
            <P>
              Processing time: <strong>1–2 business days</strong> before dispatch.
            </P>
          </Section>

          <Section title="3. Estimated Delivery Timeline">
            <P>Estimated delivery timelines from the date of dispatch:</P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li><strong>Metro cities</strong> (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata): 3–5 business days</Li>
              <Li><strong>Tier 2 & 3 cities:</strong> 5–7 business days</Li>
              <Li><strong>Remote/rural areas:</strong> 7–10 business days</Li>
              <Li><strong>Express Delivery:</strong> 1–2 business days (select pin codes)</Li>
            </Box>
          </Section>

          <Section title="4. Order Tracking">
            <P>
              Once your order is dispatched, you will receive an email/SMS with a tracking number and
              a link to track your shipment. You can also track your order anytime by logging into your
              account and visiting <strong>My Orders</strong>.
            </P>
          </Section>

          <Section title="5. Shipping Partners">
            <P>
              We ship with trusted logistics partners including Shiprocket, Delhivery, BlueDart, and other
              regional carriers. The carrier assigned depends on your delivery location and the shipping
              method selected.
            </P>
          </Section>

          <Section title="6. Delivery Attempts">
            <P>
              Our logistics partners will attempt delivery up to <strong>3 times</strong>. If delivery is
              unsuccessful after 3 attempts, the package may be returned to our warehouse. In such cases,
              re-delivery charges may apply. Please ensure someone is available at the delivery address
              during business hours.
            </P>
          </Section>

          <Section title="7. Incorrect or Incomplete Address">
            <P>
              We are not responsible for delays or failed deliveries caused by incorrect or incomplete
              addresses provided at checkout. Please double-check your shipping address before placing
              an order. Contact us immediately at <strong>support@theuniquedressup.com</strong> if you
              need to update your address after placing an order (before dispatch).
            </P>
          </Section>

          <Section title="8. Delays">
            <P>
              While we make every effort to deliver on time, delivery timelines are estimates and may be
              affected by factors beyond our control including:
            </P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li>High volume periods (sale events, festivals)</Li>
              <Li>Natural disasters, strikes, or other force majeure events</Li>
              <Li>Logistics partner operational issues</Li>
              <Li>Incorrect address or failed delivery attempts</Li>
            </Box>
          </Section>

          <Section title="9. Contact Us">
            <P>For shipping-related queries, please contact us:</P>
            <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 1.5, p: 2.5, mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#444', fontWeight: 700, mb: 0.5 }}>Unique Dressup — Customer Support</Typography>
              <Typography variant="body2" sx={{ color: '#444' }}>Email: support@theuniquedressup.com</Typography>
              <Typography variant="body2" sx={{ color: '#444' }}>Support Hours: Monday–Saturday, 10 AM – 6 PM IST</Typography>
            </Box>
          </Section>

        </Box>
      </Container>
    </Box>
  );
}
