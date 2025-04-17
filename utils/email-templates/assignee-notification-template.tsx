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

interface AssigneeNotificationProps {
  ticketSubject: string;
  ticketId: string;
  dashboardUrl: string;
  fromName?: string;
  fromEmail?: string;
  messageContent: string;
}

export const AssigneeNotificationTemplate = ({
  ticketSubject,
  ticketId,
  dashboardUrl,
  fromName,
  fromEmail,
  messageContent,
}: AssigneeNotificationProps) => {
  const senderInfo = fromName ? `${fromName} (${fromEmail})` : fromEmail;
  
  return (
    <Html>
      <Head />
      <Preview>New reply on ticket: {ticketSubject}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Ticket Update Notification</Heading>
          <Section style={sectionStyle}>
            <Text style={textStyle}>
              A ticket assigned to you has received a new reply:
            </Text>
            <Text style={ticketInfoStyle}>
              <strong>Ticket:</strong> {ticketSubject}
            </Text>
            <Text style={ticketInfoStyle}>
              <strong>Ticket ID:</strong> {ticketId}
            </Text>
            {senderInfo && (
              <Text style={ticketInfoStyle}>
                <strong>From:</strong> {senderInfo}
              </Text>
            )}
            
            <Section style={messageContentStyle}>
              <Text style={contentHeaderStyle}>Reply Content:</Text>
              <div dangerouslySetInnerHTML={{ __html: messageContent }} />
            </Section>
            
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
              This is an automated notification from TicketFast. Please do not reply to this email.
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

const messageContentStyle = {
  backgroundColor: '#f9f9f9',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  margin: '20px 0',
  padding: '15px',
};

const contentHeaderStyle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '10px',
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

export default AssigneeNotificationTemplate;
