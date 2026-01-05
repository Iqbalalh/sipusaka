import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      username?: string;
      email?: string;
      staffName?: string;
      roleName?: string;
      staffPict?: string;
      token?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id?: string;
    username?: string;
    email?: string;
    staffName?: string;
    roleName?: string;
    staffPict?: string;
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    email?: string;
    staffName?: string;
    roleName?: string;
    staffPict?: string;
    accessToken?: string;
  }
}
