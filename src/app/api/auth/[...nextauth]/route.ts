import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcrypt";

const prisma = new PrismaClient();

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "twojmail@studms.ug.edu.pl" },
        password: { label: "Hasło", type: "password" },
      },
        async authorize(credentials) {
          // walidacja danych wejściowych
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email i hasło są wymagane.");
          }

          // sprawdzenie domeny UG
          if (!credentials.email.endsWith("@studms.ug.edu.pl")) {
            throw new Error("Musisz mieć email w domenie @studms.ug.edu.pl!");
          }

          // pobranie użytkownika z bazy
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Nie ma takiego użytkownika");
          }

          // wyjątek testowy – pomiń weryfikację e-maila dla wybranych kont testowych
          const isTestUser =
            user.email === "k.kowalski.123@studms.ug.edu.pl" ||
            user.email === "m.nowak.036@studms.ug.edu.pl"||
            user.email === "a.lewandowska.070@studms.ug.edu.pl";

          if (!isTestUser && !user.emailVerified) {
            throw new Error("Musisz potwierdzić swój adres email przed zalogowaniem.");
          }

          if (!user.name) {
            throw new Error("Profil użytkownika jest niekompletny.");
          }

          // porównanie hasła
          const isValid = await compare(credentials.password, user.hashedPassword);
          if (!isValid) {
            throw new Error("Złe hasło!");
          }

          // zwrócenie danych użytkownika do sesji
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            major: user.major || undefined,
            image: user.image || undefined,
          };
        }
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minut
    updateAge: 10 * 60, // 10 minut
  },

  callbacks: {
    // callback JWT – dodaje dane użytkownika do tokena
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name!;
        token.major = user.major;
        token.image = user.image;
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      console.log("JWT Callback:", token);
      return token;
    },

    // callback sesji – dodaje dane tokena do sesji użytkownika
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email!,
          name: token.name!,
          major: token.major,
          image: token.image,
        };
      }

      console.log("Session Callback:", session);
      return session;
    },
  },

  // konfiguracja ciasteczka sesyjnego
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
