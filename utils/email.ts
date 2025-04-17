"use server";

import { db, inbox, SmtpSettings, user } from "../db";
import { eq } from "drizzle-orm";
import { render } from "@react-email/render";
import { VerificationTemplate } from "./email-templates/verification-template";
import { OrganizationInviteTemplate } from "./email-templates/organization-invite-template";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Email template types supported by the application
 */
export type Template =
  | "verification-template"
  | "otp-template"
  | "organization-invite-template";

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
