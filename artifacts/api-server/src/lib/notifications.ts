import sgMail from "@sendgrid/mail";
import { logger } from "./logger";

type BookingEmailContext = {
  guestName: string;
  guestEmail: string;
  roomName: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guestCount: number;
  specialRequests: string | null;
  bookingId: number;
};

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
} else {
  logger.warn(
    "SENDGRID_API_KEY is not set. Email notifications are disabled.",
  );
}

function emailsEnabled(): boolean {
  if (!sendgridApiKey || !sendgridFromEmail) {
    logger.warn(
      "Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL. Skipping email notification.",
    );
    return false;
  }
  return true;
}

function formatDate(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function bookingDetailsBlock(ctx: BookingEmailContext): string {
  return [
    `Booking ID: #${ctx.bookingId}`,
    `Room: ${ctx.roomName}`,
    `Check-in: ${formatDate(ctx.checkIn)}`,
    `Check-out: ${formatDate(ctx.checkOut)}`,
    `Guests: ${ctx.guestCount}`,
    `Special Requests: ${ctx.specialRequests?.trim() || "None"}`,
  ].join("\n");
}

async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!emailsEnabled()) return;

  try {
    await sgMail.send({
      to: params.to,
      from: sendgridFromEmail as string,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  } catch (error) {
    logger.error({ err: error, to: params.to }, "Failed to send email");
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function bookingDetailsRows(ctx: BookingEmailContext): string {
  const rows: Array<[string, string]> = [
    ["Booking ID", `#${ctx.bookingId}`],
    ["Room", ctx.roomName],
    ["Check-in", formatDate(ctx.checkIn)],
    ["Check-out", formatDate(ctx.checkOut)],
    ["Guests", String(ctx.guestCount)],
    ["Special Requests", ctx.specialRequests?.trim() || "None"],
  ];

  return rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;width:160px;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");
}

function buildBrandedHtmlEmail(params: {
  title: string;
  intro: string;
  closing: string;
  ctx: BookingEmailContext;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#000000;padding:20px 24px;border-bottom:3px solid #c8a13b;">
                <div style="color:#c8a13b;font-size:28px;font-weight:700;letter-spacing:0.5px;font-family:Georgia,Times,serif;">
                  BALAR iBOOK
                </div>
                <div style="color:#e5e7eb;font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">
                  Boac · Marinduque · Philippines
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 14px 0;color:#111827;font-size:15px;">Hello ${escapeHtml(params.ctx.guestName)},</p>
                <h2 style="margin:0 0 12px 0;color:#111827;font-size:24px;font-family:Georgia,Times,serif;">${escapeHtml(params.title)}</h2>
                <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6;">${escapeHtml(params.intro)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf7;border:1px solid #f0e2b6;padding:14px 16px;">
                  ${bookingDetailsRows(params.ctx)}
                </table>
                <p style="margin:18px 0 0 0;color:#374151;font-size:15px;line-height:1.6;">${escapeHtml(params.closing)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#fafafa;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
                This is an automated message from Balar iBOOK.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendBookingPendingEmail(
  ctx: BookingEmailContext,
): Promise<void> {
  await sendEmail({
    to: ctx.guestEmail,
    subject: "Balar iBOOK - Booking Received (Pending Confirmation)",
    text: [
      `Hello ${ctx.guestName},`,
      "",
      "Thank you for booking with Balar Hotel.",
      "Your reservation request has been received and is now pending review by our staff.",
      "",
      bookingDetailsBlock(ctx),
      "",
      "We will send another email once your booking is approved or rejected.",
      "",
      "Balar iBOOK",
    ].join("\n"),
    html: buildBrandedHtmlEmail({
      title: "Booking Received (Pending Confirmation)",
      intro:
        "Thank you for booking with Balar Hotel. Your reservation request has been received and is now pending review by our staff.",
      closing:
        "We will send another email once your booking is approved or rejected.",
      ctx,
    }),
  });
}

export async function sendBookingDecisionEmail(
  decision: "approved" | "rejected",
  ctx: BookingEmailContext,
): Promise<void> {
  const isApproved = decision === "approved";
  const intro = isApproved
    ? "Great news! Your booking request has been approved. Please note that your reservation is only valid within 8 hours from the time this email was sent. Kindly ensure that you arrive within the given book schedule. Otherwise, your booking will be automatically declined."
    : "Thank you for your interest. We are sorry, but your booking request was not approved at this time.";
  
  const closing = isApproved
    ? "We look forward to welcoming you to Balar Hotel. Remember, you have 8 hours from the timestamp of this email to arrive and confirm your check-in."
    : "You may submit another request with different dates or room preferences.";
  
  await sendEmail({
    to: ctx.guestEmail,
    subject: isApproved
      ? "Balar iBOOK - Booking Approved"
      : "Balar iBOOK - Booking Rejected",
    text: [
      `Hello ${ctx.guestName},`,
      "",
      intro,
      "",
      bookingDetailsBlock(ctx),
      "",
      closing,
      "",
      "Balar iBOOK",
    ].join("\n"),
    html: buildBrandedHtmlEmail({
      title: isApproved ? "Booking Approved" : "Booking Rejected",
      intro: intro,
      closing: closing,
      ctx,
    }),
  });
}
