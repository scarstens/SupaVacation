import NextAuth from "next-auth/next";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// Instantiate Prisma Client
const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
    verifyRequest: "/",
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 30 * 60, // Magic links are valid for 30 min only
    }),
  ],
});
