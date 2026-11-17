import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !user || !password || !from) {
    throw new Error("PASSWORD_RESET_EMAIL_NOT_CONFIGURED");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT_INVALID");
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass: password },
    from,
  };
}

export function assertPasswordResetEmailConfigured() {
  getSmtpConfig();
  const resetUrl = process.env.PASSWORD_RESET_URL?.trim();
  if (!resetUrl) {
    throw new Error("PASSWORD_RESET_URL_NOT_CONFIGURED");
  }

  const parsedUrl = new URL(resetUrl);
  if (
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
    (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:")
  ) {
    throw new Error("PASSWORD_RESET_URL_INVALID");
  }
}

export function createPasswordResetUrl(token: string) {
  assertPasswordResetEmailConfigured();
  const url = new URL(process.env.PASSWORD_RESET_URL!.trim());
  url.searchParams.set("token", token);
  return url.toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  const safeUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Redefinição de senha - Nova Chance",
    text: `Use este link para redefinir sua senha. Ele expira em 30 minutos e só pode ser usado uma vez:\n\n${resetUrl}\n\nSe você não solicitou a redefinição, ignore este email.`,
    html: `<p>Recebemos um pedido para redefinir sua senha no Nova Chance.</p><p><a href="${safeUrl}">Redefinir senha</a></p><p>O link expira em 30 minutos e só pode ser usado uma vez.</p><p>Se você não solicitou a redefinição, ignore este email.</p>`,
  });
}
