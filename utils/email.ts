"use server"

import { db, user } from "../db";
import { eq } from "drizzle-orm";
import mailgun from "mailgun-js";
import { render } from "@react-email/render";
import { VerificationTemplate } from "./email-templates/verification-template";

/**
 * Email template types supported by the application
 */
type Template = "verification-template" | "otp-template";

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
 * Renders an email template based on the template name and props
 * @param template The template identifier
 * @param props The props to pass to the template
 * @returns HTML string of the rendered email
 */
async function renderEmailTemplate(template: Template, props: VerificationEmailTemplateProps): Promise<string> {
  switch (template) {
    case "verification-template":
      return render(VerificationTemplate(props));
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

    // Send the email using Mailgun
    const mg = mailgun({
      apiKey: process.env.MAILGUN_API_KEY || "",
      domain: "ticketfa.st",
    });

    const result = await mg.messages().send({
      from: process.env.FROM_ADDRESS || "no-reply@ticketfa.st",
      to,
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully to:", to);
    return result;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}
