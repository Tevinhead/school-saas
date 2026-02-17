import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const client = getResend();
  return client.emails.send({
    from: "School SaaS <noreply@school-saas.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}

export { getResend };
