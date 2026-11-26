import { logger } from "@paramlab/config";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type { ReactNode } from "react";
import { Resend } from "resend";

import { env } from "./env";
import { postboxConfigured, sendViaPostbox } from "./postbox";

const DEFAULT_EMAIL_FROM = "Acme <onboarding@resend.dev>";
const resolveFrom = (from?: string) =>
  from ?? env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;

// Fallback provider: Resend.
export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

export interface Emails {
  react: ReactNode;
  subject: string;
  to: string[];
  from?: string;
}

export type EmailHtml = {
  html: string;
  subject: string;
  to: string[];
  from?: string;
};

const sendViaResend = async (email: EmailHtml) => {
  if (!resend) {
    throw new Error("Resend is not configured");
  }
  await resend.emails.send({
    to: email.to,
    from: resolveFrom(email.from),
    subject: email.subject,
    html: email.html,
  });
};

/**
 * Delivers a rendered email: Yandex Cloud Postbox first, Resend as fallback.
 * If Postbox is configured but fails (network, auth, provider outage), the
 * same message is retried through Resend so delivery is not lost.
 */
const deliver = async (email: EmailHtml) => {
  if (postboxConfigured) {
    try {
      await sendViaPostbox(email);
      return;
    } catch (error) {
      logger.error("email.postbox_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!resend) {
        // Rethrow so callers (e.g. the Hatchet "send-email" task) can retry.
        throw error;
      }
      logger.warn("email.postbox_fallback_resend", { to: email.to });
      await sendViaResend(email);
      return;
    }
  }
  if (!resend) {
    logger.warn("email.not_configured", {
      hint: "Add YANDEX_POSTBOX_ACCESS_KEY_ID / YANDEX_POSTBOX_SECRET_ACCESS_KEY or RESEND_API_KEY to .env for emails to work",
    });
    return;
  }
  await sendViaResend(email);
};

export const sendEmail = async (email: Emails) => {
  if (env.EMAIL_SANDBOX_ENABLED) {
    const mailOptions: Mail.Options = {
      from: resolveFrom(email.from),
      to: email.to,
      html: await render(email.react),
      subject: email.subject,
    };
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SANDBOX_HOST,
      secure: false,
      port: 2500,
    });
    return transporter.sendMail(mailOptions);
  }
  await deliver({
    to: email.to,
    subject: email.subject,
    html: await render(email.react),
    from: email.from,
  });
};

export const sendEmailHtml = async (email: EmailHtml) => {
  if (env.EMAIL_SANDBOX_ENABLED) {
    const mailOptions: Mail.Options = {
      from: resolveFrom(email.from),
      to: email.to,
      html: email.html,
      subject: email.subject,
    };
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SANDBOX_HOST,
      secure: false,
      port: 2500,
    });
    return transporter.sendMail(mailOptions);
  }
  await deliver(email);
};
