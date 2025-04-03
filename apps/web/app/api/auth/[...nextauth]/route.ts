import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials!;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw new Error(error.message);
        return data.user;
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_ANON_KEY!,
  }),
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      session.user.id = user.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
