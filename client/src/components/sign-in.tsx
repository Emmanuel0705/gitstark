"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function SignIn() {
  return (
    <Button onClick={() => signIn("github")} className="font-medium px-8">
      Get Started
    </Button>
  );
}
