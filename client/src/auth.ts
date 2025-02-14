import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "repo read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add access token to session for GitHub API calls
      return {
        ...session,
        accessToken: token.accessToken,
      };
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});
