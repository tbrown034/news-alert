import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { Pool } from "pg";
import { ADMIN_EMAILS } from "@/lib/admin";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Check if user's email is in the allowlist
          const email = user.email?.toLowerCase();
          if (!email || !ADMIN_EMAILS.includes(email)) {
            throw new APIError("FORBIDDEN", {
              message: "Access restricted to authorized users only",
            });
          }
          return { data: user };
        },
      },
    },
  },
});
