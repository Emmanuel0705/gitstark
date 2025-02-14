import { DefaultSession } from "@auth/core/types";

declare module "@auth/core/types" {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
    } & DefaultSession["user"];
  }
}
