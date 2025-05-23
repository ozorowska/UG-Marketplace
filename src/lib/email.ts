// importujemy klasę Resend – to klient API do wysyłania e-maili
import { Resend } from "resend";

// tworzymy instancję klienta Resend i przekazujemy mu nasz klucz API z pliku .env
const resend = new Resend(process.env.RESEND_API_KEY);

// eksportujemy funkcję, którą można wywołać z dowolnego miejsca w aplikacji
// np. z API rejestracji – wysyła ona link aktywacyjny e-mailem
export async function sendVerificationEmail(email: string, token: string) {
  // budujemy link aktywacyjny na podstawie tokena i adresu naszej aplikacji (np. localhost lub Vercel)
  const link = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;

  try {
    // wysyłamy wiadomość przez API Resend
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!, // adres nadawcy (musi być zatwierdzony w panelu Resend)
      to: email,                     // adres e-mail odbiorcy (czyli użytkownika)
      subject: "Potwierdź swój email - UG Marketplace", // temat wiadomości

      // treść wiadomości jako HTML – zawiera link aktywacyjny
      html: `
        <h2>Witaj!</h2>
        <p>Dziękujemy za rejestrację w UG Marketplace.</p>
        <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
        <a href="${link}">${link}</a>
        <p>Jeśli to nie Ty – zignoruj ten mail.</p>
      `,
    });

    // logujemy wynik w konsoli (np. ID wiadomości, status)
    console.log("Email wysłany:", result);
  } catch (err) {
    // jeśli coś pójdzie nie tak, logujemy błąd w konsoli (np. brak uprawnień, błąd API Resend)
    console.error("Błąd przy wysyłce emaila:", err);
  }
}
