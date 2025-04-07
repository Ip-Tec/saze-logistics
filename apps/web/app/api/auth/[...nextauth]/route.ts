import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const authOptions = {
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
    // This callback runs when a user signs in.
    async signIn({ user, account, profile }: any) {
      if (account.provider === "google") {
        // Check if a profile row exists for this user.
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          // If not, create the profile row.
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                name: user.name || profile?.name || "Google User",
                email: user.email,
                phone: "", // You may not get a phone number from Google, so default to an empty string.
                role: "user", // Set a default role for OAuth users; adjust as needed.
              },
            ]);
          if (insertError) {
            console.error("Error creating profile:", insertError.message);
            // Returning false denies sign-in. You could also choose to let the sign-in proceed.
            return false;
          }
        }
      }
      return true;
    },
    async session({ session, user }: any) {
      // Make sure the session includes the user id.
      session.user.id = user.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
