import type { Metadata } from 'next';
import { Box, Container, Typography, Divider } from '@mui/material';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unique Dressup',
  description: 'Learn how Unique Dressup collects, uses, and protects your personal information.',
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

export default function PrivacyPolicyPage() {
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
            Privacy Policy
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
            Welcome to Unique Dressup ("we", "our", or "us"). We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you visit our website{' '}
            <strong>www.theuniquedressup.com</strong> and make purchases from us.
          </P>
          <P>
            Please read this policy carefully. If you disagree with its terms, please discontinue use of our site.
          </P>

          <Divider sx={{ my: 4 }} />

          <Section title="1. Information We Collect">
            <P>We collect information you provide directly to us, including:</P>
            <Box component="ul" sx={{ pl: 3, m: 0, mb: 1.5 }}>
              <Li>Name, email address, phone number, and billing/shipping address</Li>
              <Li>Payment information (processed securely by our payment partners — we do not store card details)</Li>
              <Li>Account credentials (username and encrypted password)</Li>
              <Li>Order history and preferences</Li>
              <Li>Communications you send us (support queries, reviews)</Li>
            </Box>
            <P>We also automatically collect certain information when you use our site:</P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li>Device information (browser type, operating system, IP address)</Li>
              <Li>Usage data (pages viewed, time spent, referring URLs)</Li>
              <Li>Cookies and similar tracking technologies</Li>
            </Box>
          </Section>

          <Section title="2. How We Use Your Information">
            <P>We use the information we collect to:</P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li>Process and fulfill your orders, including payment processing and shipping</Li>
              <Li>Create and manage your account</Li>
              <Li>Send order confirmations, invoices, and shipping notifications</Li>
              <Li>Respond to your queries and provide customer support</Li>
              <Li>Send promotional emails and offers (you may opt out anytime)</Li>
              <Li>Improve our website, products, and services</Li>
              <Li>Detect and prevent fraud and unauthorized transactions</Li>
              <Li>Comply with legal obligations</Li>
            </Box>
          </Section>

          <Section title="3. Payment Processing">
            <P>
              All payments on our platform are processed through <strong>Cashfree Payments</strong> and
              <strong> Razorpay</strong>, which are PCI-DSS compliant payment gateways. We do not store your
              credit/debit card numbers or bank account details on our servers. Your financial information
              is encrypted and handled entirely by our payment partners.
            </P>
            <P>
              For Cash on Delivery (COD) orders, a delivery charge is collected online via our payment
              gateway; the product amount is paid to the delivery executive upon receipt.
            </P>
          </Section>

          <Section title="4. Sharing Your Information">
            <P>We may share your information with:</P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li><strong>Payment processors</strong> (Cashfree, Razorpay) to complete transactions</Li>
              <Li><strong>Logistics partners</strong> to deliver your orders (name, address, phone)</Li>
              <Li><strong>Analytics providers</strong> (aggregated, anonymised data only)</Li>
              <Li><strong>Law enforcement or government authorities</strong> when required by law</Li>
            </Box>
            <P>We do not sell, trade, or rent your personal information to third parties for marketing purposes.</P>
          </Section>

          <Section title="5. Cookies">
            <P>
              We use cookies and similar technologies to enhance your browsing experience, remember your
              preferences, analyse site traffic, and personalise content. You can control cookies through
              your browser settings. Disabling cookies may affect certain features of our website.
            </P>
          </Section>

          <Section title="6. Data Security">
            <P>
              We implement industry-standard security measures including SSL/TLS encryption, secure servers,
              and access controls to protect your personal data. However, no method of transmission over the
              internet is 100% secure, and we cannot guarantee absolute security.
            </P>
          </Section>

          <Section title="7. Data Retention">
            <P>
              We retain your personal data for as long as necessary to fulfill the purposes outlined in this
              policy, or as required by law. Order data is retained for a minimum of 7 years for tax and
              accounting compliance. You may request deletion of your account data by contacting us.
            </P>
          </Section>

          <Section title="8. Your Rights">
            <P>You have the right to:</P>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Li>Access the personal data we hold about you</Li>
              <Li>Request correction of inaccurate data</Li>
              <Li>Request deletion of your personal data (subject to legal obligations)</Li>
              <Li>Opt out of marketing communications at any time</Li>
              <Li>Lodge a complaint with the relevant data protection authority</Li>
            </Box>
          </Section>

          <Section title="9. Children's Privacy">
            <P>
              Our services are not directed to individuals under 18 years of age. We do not knowingly collect
              personal information from children. If you believe we have inadvertently collected such
              information, please contact us immediately.
            </P>
          </Section>

          <Section title="10. Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by posting the new policy on this page with an updated date. Your continued use of our website
              after any changes constitutes acceptance of the revised policy.
            </P>
          </Section>

          <Section title="11. Contact Us">
            <P>
              If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:
            </P>
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
