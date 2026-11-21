import { logger } from "@paramlab/config";
import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type { ReactNode } from "react";
import { Resend } from "resend";

import { env } from "./env";

// Primary provider: Yandex Cloud Postbox (AWS-SES-compatible API).
// Static access keys of a service account with the `postbox.sender` role.
export const postbox =
  env.YANDEX_POSTBOX_ACCESS_KEY_ID && env.YANDEX_POSTBOX_SECRET_ACCESS_KEY
    ? new SESv2Client({
        region: env.YANDEX_POSTBOX_REGION,
        endpoint: env.YANDEX_POSTBOX_ENDPOINT,
        credentials: {
          accessKeyId: env.YANDEX_POSTBOX_ACCESS_KEY_ID,
          secretAccessKey: env.YANDEX_POSTBOX_SECRET_ACCESS_KEY,
        },
      })
    : null;

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

const sendViaPostbox = async (email: EmailHtml) => {
  if (!postbox) {
    throw new Error("Yandex Cloud Postbox is not configured");
  }
  const message: SendEmailCommandInput = {
    FromEmailAddress: email.from ?? env.EMAIL_FROM,
    Destination: { ToAddresses: email.to },
    Content: {
      Simple: {
        Subject: { Data: email.subject, Charset: "UTF-8" },
        Body: { Html: { Data: email.html, Charset: "UTF-8" } },
      },
    },
  };
  const result = await postbox.send(new SendEmailCommand(message));
  logger.info("email.sent_via_postbox", { messageId: result.MessageId });
};

const sendViaResend = async (email: EmailHtml) => {
  if (!resend) {
    throw new Error("Resend is not configured");
  }
  await resend.emails.send({
    to: email.to,
    from: email.from ?? env.EMAIL_FROM,
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
  if (postbox) {
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
      from: email.from ?? env.EMAIL_FROM,
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
      from: email.from ?? env.EMAIL_FROM,
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
