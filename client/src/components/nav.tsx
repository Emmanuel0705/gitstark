import React from "react";
import { SelectRepoCombobox } from "./select-repo-combobox";
import { Button } from "./ui/button";
import { Github } from "lucide-react";
import { auth, signIn } from "@/auth";
import { Banner } from "./banner";
import { SidebarTrigger } from "./ui/sidebar";

import { WalletConnectButton } from "./connect-wallet";
import { UserDropdownMenu } from "./user-dropdown-menu";
import { HelpDialog } from "./help-dialogue";
import LogoRender from "./logo";

// interface GitHubRepo {
//   id: number;
//   name: string;
//   full_name: string;
//   private: boolean;
//   html_url: string;
//   description: string | null;
// }

// async function getGitHubRepos(): Promise<GitHubRepo[]> {
//   const response = await fetch(`http://localhost:3000/api/github-repos`, {
//     cache: "no-store",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (!response.ok) {
//     throw new Error("Failed to fetch repositories");
//   }

//   return response.json();
// }

export default async function NavBar() {
  const session = await auth();

  return (
    <header className="bg-background/10 bg-opacity-20 backdrop-blur sticky top-0  z-40 ">
      <Banner
        message="🎉 New features coming soon!"
        height="2rem"
        variant="rainbow"
        className="mb-4"
        id="1"
      />
      <div className=" flex items-center justify-between gap-3  overflow-x-auto overflow-y-visible py-2 pl-2 pr-4 md:pl-3.5 md:pr-5">
        {session?.accessToken ? (
          <SelectRepoCombobox
            accessToken={session.accessToken}
            image={session?.user?.image as string}
          />
        ) : (
          <LogoRender />
        )}
        <div className="flex items-center ms-auto gap-x-3.5">
          <HelpDialog />
          {session?.accessToken ? (
            <>
              <WalletConnectButton />

              <UserDropdownMenu />
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <Button type="submit">
                <Github /> Signin with GitHub
              </Button>
            </form>
          )}
        </div>
      </div>
      {session?.accessToken ? (
        <SidebarTrigger className="absolute left-1 -bottom-10 z-50" />
      ) : null}
    </header>
  );
}
