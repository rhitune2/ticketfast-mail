import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  url: string;
}

export const VerificationTemplate = ({ url }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for TicketFast</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Verify your email address</Heading>
          <Section style={sectionStyle}>
            <Text style={textStyle}>
              Thank you for signing up for TicketFast! Please verify your email address by clicking the button below.
            </Text>
            <Button style={buttonStyle} href={url}>
              Verify Email
            </Button>
            <Text style={textStyle}>
              If the button doesn't work, you can also click on this link or copy and paste it into your browser:
            </Text>
            <Text style={linkTextStyle}>
              <Link href={url} style={linkStyle}>{url}</Link>
            </Text>
            <Text style={footerStyle}>
              If you didn't sign up for TicketFast, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const bodyStyle = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: '0 auto',
  padding: '20px',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
};

const headingStyle = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const sectionStyle = {
  margin: '0 auto',
};

const textStyle = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const buttonStyle = {
  backgroundColor: '#4f46e5',
  borderRadius: '4px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '24px auto',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '220px',
};

const linkTextStyle = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
  wordBreak: 'break-all' as const,
};

const linkStyle = {
  color: '#4f46e5',
  textDecoration: 'underline',
};

const footerStyle = {
  color: '#8898aa',
  fontSize: '14px',
  fontStyle: 'italic',
  marginTop: '32px',
};

export default VerificationTemplate;