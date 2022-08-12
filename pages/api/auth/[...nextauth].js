import NextAuth from "next-auth/next";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import nodemailer from "nodemailer";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import path from "path";

// Configure custom magic link emails
// TODO: Do more testing with secure setting on nodemail transporter
const emailsDir = path.resolve(process.cwd(), "emails");
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  // secure: process.env.EMAIL_SERVER_SSL === "true",
});
const sendVerificationRequest = ({ identifier, url }) => {
  const emailFile = readFileSync(path.join(emailsDir, "confirm-email.html"), {
    encoding: "utf8",
  });
  const emailTemplate = Handlebars.compile(emailFile);
  console.log("Preparing login as email to be sent...");
  transporter.sendMail({
    from: `"✨ SupaVacation" ${process.env.EMAIL_FROM}`,
    to: identifier,
    subject: "Your sign-in link for SupaVacation",
    html: emailTemplate({
      base_url: process.env.NEXTAUTH_URL,
      signin_url: url,
      email: identifier,
    }),
  });
};

const sendWelcomeEmail = async ({ user }) => {
  const { email } = user;

  try {
    const emailFile = readFileSync(path.join(emailsDir, "welcome.html"), {
      encoding: "utf8",
    });
    const emailTemplate = Handlebars.compile(emailFile);
    await transporter.sendMail({
      from: `"✨ SupaVacation" ${process.env.EMAIL_FROM}`,
      to: email,
      subject: "Welcome to SupaVacation! 🎉",
      html: emailTemplate({
        base_url: process.env.NEXTAUTH_URL,
        support_email: "support@scarstens.dev",
      }),
    });
  } catch (error) {
    console.log(
      "Server Error: Unable to send welcome email to user at " + email
    );
  }
};

// Initialize NextAuth configuration
export default NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
    verifyRequest: "/",
  },
  events: { createUser: sendWelcomeEmail },
  providers: [
    EmailProvider({
      // server: {
      //   host: process.env.EMAIL_SERVER_HOST,
      //   port: process.env.EMAIL_SERVER_PORT,
      //   auth: {
      //     user: process.env.EMAIL_SERVER_USER,
      //     pass: process.env.EMAIL_SERVER_PASSWORD,
      //   },
      // },
      // from: process.env.EMAIL_FROM,
      sendVerificationRequest,
      maxAge: 30 * 60, // Magic links are valid for 30 min only
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
});
