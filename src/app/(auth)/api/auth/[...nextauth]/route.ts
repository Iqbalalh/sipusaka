import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_AUTH_LOGIN } from "@/constants/endpoint";

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email?: string;
    staff_name?: string;
    role_name?: string;
    staff_pict?: string;
  };
  token: string;
  message?: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const res = await fetch(API_AUTH_LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const data: LoginResponse = await res.json();
          if (!res.ok) return null;
          return {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            staffName: data.user.staff_name,
            roleName: data.user.role_name,
            staffPict: data.user.staff_pict,
            token: data.token,
          };
        } catch (error) {
          console.error("Network or Fetch Error during login:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.staffName = user.staffName;
        token.roleName = user.roleName;
        token.staffPict = user.staffPict;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.staffName = token.staffName;
        session.user.roleName = token.roleName;
        session.user.staffPict = token.staffPict;
        session.user.token = token.accessToken;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
