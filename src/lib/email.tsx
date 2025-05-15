// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Potwierdź swój email - UG Marketplace",
      html: `
        <h2>Witaj!</h2>
        <p>Dziękujemy za rejestrację w UG Marketplace.</p>
        <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
        <a href="${link}">${link}</a>
        <p>Jeśli to nie Ty – zignoruj ten mail.</p>
      `,
    });

    console.log("✅ Email wysłany:", result);
  } catch (err) {
    console.error("❌ Błąd przy wysyłce emaila:", err);
  }
}
