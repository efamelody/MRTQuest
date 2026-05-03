import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/utils/prisma";

let auth: any;

try {
  auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {    
        enabled: true
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
  console.log("✅ [auth.ts] Better Auth initialized successfully");
} catch (error) {
  console.error("❌ [auth.ts] Failed to initialize Better Auth:", error);
  throw error;
}

export { auth };