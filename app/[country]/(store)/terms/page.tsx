import type { Metadata } from 'next';
import { Box, Container, Typography, Divider } from '@mui/material';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Unique Dressup',
  description: 'Read the terms and conditions governing your use of Unique Dressup website and services.',
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

export default function TermsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: '#1a1a1a', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
          >
            Legal
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 1.5 }}
          >
            Terms &amp; Conditions
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Last updated: {LAST_UPDATED}
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: { xs: 3, md: 5 } }}>

          <P>
            These Terms &amp; Conditions ("Terms") govern your use of the website{' '}
            <strong>www.theuniquedressup.com</strong> operated by <strong>Unique Dressup</strong>
            ("we", "us", or "our"). By accessing or using our website, you agree to be bound by these Terms.
            If you do not agree, please do not use our website.
          </P>

          <Divider sx={{ my: 4 }} />

          <Section title="1. Use of Website">
            <P>You agree to use this website only for lawful purposes and in a manner that does not:</P>
            <Box component="ul" sx={{ pl: 3, m: 0, mb: 1.5 }}>
              <Li>Violate any applicable local, national, or international law or regulation</Li>
              <Li>Transmit unsolicited or unauthorised advertising or promotional material</Li>
              <Li>Transmit any data containing viruses, malware, or other harmful code</Li>
              <Li>Attempt to gain unauthorised access to any part of our website or systems</Li>
              <Li>Interfere with the proper working of our website</Li>
            </Box>
            <P>
              We reserve the right to terminate or restrict your access to our website at our discretion,
              without notice, for conduct that violates these Terms.
            </P>
          </Section>

          <Section title="2. Account Registration">
            <P>
              To place an order, you may need to create an account. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities that occur under your account.
              You agree to notify us immediately of any unauthorised use of your account.
            </P>
            <P>
              You must be at least 18 years of age to create an account and make purchases on our website.
            </P>
          </Section>

          <Section title="3. Products and Pricing">
            <P>
              We make every effort to display product colours, sizes, and descriptions as accurately as possible.
              However, we cannot guarantee that your device's display will accurately reflect the actual product.
              Minor variations in colour or texture are not grounds for return unless the product is materially different.
            </P>
            <P>
              All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated
              otherwise. We reserve the right to change prices at any time without prior notice. The price at the
              time of order placement applies to your purchase.
            </P>
          </Section>

          <Section title="4. Orders and Payment">
            <P>
              By placing an order, you make an offer to purchase the selected products. We reserve the right to
              accept or decline any order. An order is confirmed only upon receipt of payment (or for COD orders,
              upon payment of the delivery charge) and issuance of an order confirmation.
            </P>
            <P>
              Payments are processed via <strong>Cashfree Payments</strong> and <strong>Razorpay</strong>.
              For COD orders, the delivery charge must be paid online; the product amount is due on delivery.
              We do not accept responsibility for payment failures due to your bank or card issuer.
            </P>
            <P>
              In the event of pricing errors, we reserve the right to cancel the order and refund any amount paid.
            </P>
          </Section>

          <Section title="5. Shipping and Delivery">
            <P>
              We ship across India. Estimated delivery timelines are provided at checkout and are indicative only.
              We are not liable for delays caused by logistics partners, customs, natural disasters, or other
              circumstances beyond our control. Please refer to our{' '}
              <strong>Shipping Policy</strong> for full details.
            </P>
          </Section>

          <Section title="6. Returns and Exchanges">
            <P>
              Return or complaint requests must be raised within 36 hours of delivery, and are accepted only
              where a wrong or damaged product has been received. A complete, uninterrupted unboxing video is
              mandatory for every such claim. Eligible returns are settled in store credit; we do not issue
              direct bank refunds. Size exchanges are available against a courier handling charge. Please refer
              to our <strong>Return &amp; Exchange Policy</strong> for full details.
            </P>
          </Section>

          <Section title="7. Intellectual Property">
            <P>
              All content on this website — including text, images, logos, graphics, product photographs, and
              software — is the property of Unique Dressup or its content suppliers and is protected by Indian
              and international intellectual property laws.
            </P>
            <P>
              You may not reproduce, distribute, modify, or create derivative works from any content on this
              website without our prior written consent.
            </P>
          </Section>

          <Section title="8. Limitation of Liability">
            <P>
              To the maximum extent permitted by applicable law, Unique Dressup shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use of
              (or inability to use) our website or products, even if we have been advised of the possibility
              of such damages.
            </P>
            <P>
              Our total liability to you for any claim arising from your use of our website or purchase of
              our products shall not exceed the amount paid by you for the relevant order.
            </P>
          </Section>

          <Section title="9. Governing Law">
            <P>
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your
              use of our website shall be subject to the exclusive jurisdiction of the courts in India.
            </P>
          </Section>

          <Section title="10. Changes to Terms">
            <P>
              We reserve the right to modify these Terms at any time. Changes will be effective immediately
              upon posting on our website. Your continued use of our website after any changes constitutes
              your acceptance of the revised Terms.
            </P>
          </Section>

          <Section title="11. Contact Us">
            <P>For questions about these Terms, please contact us:</P>
            <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 1.5, p: 2.5, mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#444', fontWeight: 700, mb: 0.5 }}>Unique Dressup</Typography>
              <Typography variant="body2" sx={{ color: '#444' }}>Email: support@theuniquedressup.com</Typography>
              <Typography variant="body2" sx={{ color: '#444' }}>Website: www.theuniquedressup.com</Typography>
            </Box>
          </Section>

        </Box>
      </Container>
    </Box>
  );
}
