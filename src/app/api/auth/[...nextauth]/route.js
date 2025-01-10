import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import { compare } from "bcryptjs"

const prisma = new PrismaClient()

const handler = NextAuth({
  // Nasz "provider" to Credentials (czyli: email+hasło)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "twojmail@studms.ug.edu.pl" },
        password: { label: "Hasło", type: "password" }
      },
      async authorize(credentials) {
        // 1. Sprawdzamy domenę emaila
        if (!credentials.email.endsWith("@studms.ug.edu.pl")) {
          throw new Error("Musisz mieć email w domenie @studms.ug.edu.pl!")
        }

        // 2. Szukamy usera w bazie (po emailu)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        if (!user) {
          throw new Error("Nie ma takiego użytkownika")
        }

        // 3. Porównujemy hasło wprowadzone z zahashowanym w bazie
        const isValid = await compare(credentials.password, user.hashedPassword)
        if (!isValid) {
          throw new Error("Złe hasło!")
        }

        // 4. Jeśli OK, zwracamy obiekt usera (bez hasła)
        return { id: user.id, email: user.email }
      }
    })
  ],
  pages: {
    signIn: "/login" // Gdzie mamy własną stronę logowania
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      // Gdy user się zaloguje, do tokena dopiszemy info
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      // W sesji chcemy mieć email
      if (token) {
        session.user = { id: token.id, email: token.email }
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
