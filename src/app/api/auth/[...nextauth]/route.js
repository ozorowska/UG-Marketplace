// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import { compare } from "bcryptjs"

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "twojmail@studms.ug.edu.pl" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        // Sprawdzenie domeny emaila
        if (!credentials.email.endsWith("@studms.ug.edu.pl")) {
          throw new Error("Musisz mieć email w domenie @studms.ug.edu.pl!")
        }

        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("Email i hasło są wymagane.")
        }
        

        // Szukanie użytkownika w bazie
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) {
          throw new Error("Nie ma takiego użytkownika")
        }

        // Porównanie hasła
        const isValid = await compare(credentials.password, user.hashedPassword)
        if (!isValid) {
          throw new Error("Złe hasło!")
        }

        // Zwrócenie użytkownika (bez hasła)
        return { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          major: user.major,
          image: user.image
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minut
    updateAge: 10 * 60, // 10 minut
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.major = user.major
        token.image = user.image
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      
      console.log("JWT Callback:", token)
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = { 
          id: token.id, 
          email: token.email,
          name: token.name,
          major: token.major,
          image: token.image
        }
      }
      console.log("Session Callback:", session)
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Nie ustawiaj expires, aby ciasteczko było sesyjne
        // expires: undefined,
      },
    },
  },
})

export { handler as GET, handler as POST }