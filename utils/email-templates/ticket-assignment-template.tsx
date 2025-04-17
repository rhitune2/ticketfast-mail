import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';

interface TicketAssignmentProps {
  ticketSubject: string;
  ticketId: string;
  dashboardUrl: string;
  assignerName?: string;
  priority?: string;
  status?: string;
}

export const TicketAssignmentTemplate = ({
  ticketSubject,
  ticketId,
  dashboardUrl,
  assignerName,
  priority,
  status,
}: TicketAssignmentProps) => {
  return (
    <Html>
      <Head />
      <Preview>A ticket has been assigned to you: {ticketSubject}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Ticket Assignment Notification</Heading>
          <Section style={sectionStyle}>
            <Text style={textStyle}>
              {assignerName 
                ? `${assignerName} has assigned a ticket to you:`
                : `A ticket has been assigned to you:`}
            </Text>
            <Text style={ticketInfoStyle}>
              <strong>Ticket:</strong> {ticketSubject}
            </Text>
            <Text style={ticketInfoStyle}>
              <strong>Ticket ID:</strong> {ticketId}
            </Text>
            {priority && (
              <Text style={ticketInfoStyle}>
                <strong>Priority:</strong> {priority}
              </Text>
            )}
            {status && (
              <Text style={ticketInfoStyle}>
                <strong>Status:</strong> {status}
              </Text>
            )}
            
            <Button style={buttonStyle} href={dashboardUrl}>
              View Ticket
            </Button>
            
            <Text style={textStyle}>
              You can also access the ticket by clicking on this link or copying it to your browser:
            </Text>
            <Text style={linkTextStyle}>
              <Link href={dashboardUrl} style={linkStyle}>{dashboardUrl}</Link>
            </Text>
            
            <Text style={footerStyle}>
              Please review this ticket at your earliest convenience.
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

const ticketInfoStyle = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '8px',
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

export default TicketAssignmentTemplate;
