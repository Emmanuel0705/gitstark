import { Github, LifeBuoy, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth, signOut } from "@/auth";
import { ModeToggle } from "./mode-toggle.";
import { Button } from "./ui/button";

export async function UserDropdownMenu() {
  const session = await auth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8">
          <AvatarImage src={session?.user?.image as string} alt={`@github`} />
          <AvatarFallback className="text-xs font-semibold">
            {session?.user?.name?.split(" ")[0][0]}
            {session?.user?.name?.split(" ")[1][0]}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-center justify-center font-medium">
            {/* <User /> */}
            <span className="font-semibold">{session?.user?.name}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>
        <ModeToggle />
        <DropdownMenuItem disabled>
          <Github />
          <span>GitHub</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <LifeBuoy />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            className="h-8 w-full justify-start gap-2"
            size="sm"
          >
            <LogOut />
            <span>Log out</span>
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
