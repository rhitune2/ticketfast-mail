"use server";

import { db, inbox, SmtpSettings, user } from "../db";
import { eq } from "drizzle-orm";
import { render } from "@react-email/render";
import { VerificationTemplate } from "./email-templates/verification-template";
import { OrganizationInviteTemplate } from "./email-templates/organization-invite-template";
import { AssigneeNotificationTemplate } from "./email-templates/assignee-notification-template";
import { TicketAssignmentTemplate } from "./email-templates/ticket-assignment-template";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Email template types supported by the application
 */
export type Template =
  | "verification-template"
  | "otp-template"
  | "organization-invite-template"
  | "assignee-notification-template"
  | "ticket-assignment-template";

/**
 * Interface for email sending props
 */
interface SendEmailProps {
  to: string;
  subject: string;
  url: string;
  template: Template;
}

/**
 * Interface for verification email template props
 */
interface VerificationEmailTemplateProps {
  url: string;
}

/**
 * Interface for organization invitation email template props
 */
interface OrganizationInviteEmailTemplateProps {
  inviteLink: string;
  teamName: string;
  invitedByUsername: string;
  invitedByEmail: string;
}

/**
 * Renders an email template based on the template name and props
 * @param template The template identifier
 * @param props The props to pass to the template
 * @returns HTML string of the rendered email
 */
async function renderEmailTemplate(
  template: Template,
  props: any
): Promise<string> {
  switch (template) {
    case "verification-template":
      return render(
        VerificationTemplate(props as VerificationEmailTemplateProps)
      );
    case "organization-invite-template":
      return render(
        OrganizationInviteTemplate(
          props as OrganizationInviteEmailTemplateProps
        )
      );
    case "assignee-notification-template":
      return render(
        AssigneeNotificationTemplate(props)
      );
    case "ticket-assignment-template":
      return render(
        TicketAssignmentTemplate(props)
      );
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

/**
 * Sends a verification email to the user
 * @param params The email parameters
 * @returns The result of the email sending operation
 */
export async function sendVerification({
  to,
  subject,
  url,
  template,
}: SendEmailProps): Promise<any> {
  try {
    // Validate user exists
    const currentUser = await db.query.user.findFirst({
      where: eq(user.email, to),
    });

    if (!currentUser) {
      throw new Error("Please Sign in again.");
    }

    // Render the email template using React Email
    const htmlContent = await renderEmailTemplate(template, { url });

    // Send the email using Forward-Email API.

    const transporter = nodemailer.createTransport({
      host: "smtp.forwardemail.net",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@ticketfa.st",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const options = {
      from: "TicketFast <no-reply@ticketfa.st>",
      to,
      subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(options);

    console.log("Email sent successfully to:", to);
    return result;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}

/**
 * Interface for organization invitation email props
 */
interface SendOrganizationInvitationProps {
  email: string;
  inviteLink: string;
  teamName: string;
  invitedByUsername: string;
  invitedByEmail: string;
}

/**
 * Sends an organization invitation email
 * @param params The invitation email parameters
 * @returns The result of the email sending operation
 */
/**
 * Interface for assignee notification email props
 */
interface SendAssigneeNotificationProps {
  assigneeEmail: string;
  ticketSubject: string;
  ticketId: string;
  fromName?: string;
  fromEmail?: string;
  messageContent: string;
}

/**
 * Sends notification email to ticket assignee
 * @param params The notification email parameters
 * @returns The result of the email sending operation
 */
/**
 * Interface for ticket assignment notification email props
 */
interface SendTicketAssignmentProps {
  assigneeEmail: string;
  ticketSubject: string;
  ticketId: string;
  assignerName?: string;
  priority?: string;
  status?: string;
}

/**
 * Sends notification email when a ticket is assigned to someone
 * @param params The assignment notification email parameters
 * @returns The result of the email sending operation
 */
export async function sendTicketAssignment({
  assigneeEmail,
  ticketSubject,
  ticketId,
  assignerName,
  priority,
  status,
}: SendTicketAssignmentProps): Promise<any> {
  try {
    const dashboardUrl = `${process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ticketfa.st"}/tickets/${ticketId}`;
    
    // Render the email template using React Email
    const htmlContent = await renderEmailTemplate(
      "ticket-assignment-template",
      {
        ticketSubject,
        ticketId,
        dashboardUrl,
        assignerName,
        priority,
        status,
      }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.forwardemail.net",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@ticketfa.st",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const options = {
      from: "TicketFast <no-reply@ticketfa.st>",
      to: assigneeEmail,
      subject: `Ticket Assigned to You: ${ticketSubject}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(options);

    console.log("Ticket assignment email sent successfully to:", assigneeEmail);
    return result;
  } catch (error) {
    console.error("Failed to send ticket assignment email:", error);
    throw error;
  }
}

export async function sendAssigneeNotification({
  assigneeEmail,
  ticketSubject,
  ticketId,
  fromName,
  fromEmail,
  messageContent,
}: SendAssigneeNotificationProps): Promise<any> {
  try {
    const dashboardUrl = `${process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ticketfa.st"}/tickets/${ticketId}`;
    
    // Render the email template using React Email
    const htmlContent = await renderEmailTemplate(
      "assignee-notification-template",
      {
        ticketSubject,
        ticketId,
        dashboardUrl,
        fromName,
        fromEmail,
        messageContent,
      }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.forwardemail.net",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@ticketfa.st",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const options = {
      from: "TicketFast <no-reply@ticketfa.st>",
      to: assigneeEmail,
      subject: `New Reply to Ticket: ${ticketSubject}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(options);

    console.log("Assignee notification email sent successfully to:", assigneeEmail);
    return result;
  } catch (error) {
    console.error("Failed to send assignee notification email:", error);
    throw error;
  }
}

export async function sendOrganizationInvitation({
  email,
  inviteLink,
  teamName,
  invitedByUsername,
  invitedByEmail,
}: SendOrganizationInvitationProps): Promise<any> {
  try {
    // Render the email template using React Email
    const htmlContent = await renderEmailTemplate(
      "organization-invite-template",
      {
        inviteLink,
        teamName,
        invitedByUsername,
        invitedByEmail,
      }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.forwardemail.net",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@ticketfa.st",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const options = {
      from: "TicketFast <no-reply@ticketfa.st>",
      to: email,
      subject: `You've been invited to join ${teamName} on TicketFast`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(options);

    console.log("Invitation email sent successfully to:", email);
    return result;
  } catch (error) {
    console.error("Failed to send organization invitation email:", error);
    throw error;
  }
}

interface SendTicketProps {
  type: "ticketfast" | "smtp";
  to: string;
  subject: string;
  url: string;
  content: string;
  smtpSettings?: SmtpSettings;
}

export async function sendTicket({
  type,
  to,
  subject,
  url,
  content,
  smtpSettings,
}: SendTicketProps): Promise<any> {
  if (type === "ticketfast") {
    // Use inbox email address for ticketfast type
    const session = await auth.api.getSession({ headers : await headers() })

    if(!session?.session?.activeOrganizationId){
      throw new Error("Unauthorized");
    }

    const userInboxMail = await db.query.inbox.findFirst({ where : eq(inbox.organizationId, session.session.activeOrganizationId)})

    if(!userInboxMail){
      throw new Error("Inbox not found.")
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.forwardemail.net",
      port: 465,
      secure: true,
      auth: {
        user: userInboxMail.emailAddress,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const options = {
      from: `${userInboxMail.name} <${userInboxMail.emailAddress}>`,
      to,
      subject: subject || `Re:`,
      html: content,
    };

    const result = await transporter.sendMail(options);
    return result;

  } else {
    // Use custom SMTP settings
    if (!smtpSettings) {
      throw new Error("Email settings not found.");
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password,
        },
      });

      const options = {
        from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
        to,
        subject: subject || `Re:`,
        html: content,
      };

      const result = await transporter.sendMail(options);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
