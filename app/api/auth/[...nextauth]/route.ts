import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Cek user di database
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email }
        });

        // 2. Jika user ditemukan di DB, baru izinkan login
        if (user && credentials?.password === "password123") {
          return { id: user.id, name: user.name, email: user.email };
        }
        return null;
      }
    })
  ],
  pages: { signIn: '/login' }
});

export { handler as GET, handler as POST };