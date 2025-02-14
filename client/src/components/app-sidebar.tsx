"use client";
import { useQuery } from "@tanstack/react-query";
import info from "@/lib/info.json";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { apiClient } from "@/lib/api";
import type { UUID } from "@elizaos/core";
import { Cog, Github, History, User } from "lucide-react";
// import ConnectionStatus from "./connection-status";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Mira from "../../public/mira.png";
import MiraWhite from "../../public/mira-white.png";
// import { ModeToggle } from "./mode-toggle.";

export function AppSidebar() {
  const pathname = usePathname();
  const query = useQuery({
    queryKey: ["agents"],
    queryFn: () => apiClient.getAgents(),
    refetchInterval: 5_000,
  });

  const agents = query?.data?.agents;

  return (
    <Sidebar>
      <SidebarHeader className="bg-transparent">
        <SidebarMenu className="bg-transparent">
          <SidebarMenuItem className="bg-transparent">
            <SidebarMenuButton className="bg-transparent" size="lg" asChild>
              <Link href="/">
                <Image
                  src={Mira}
                  alt="Mira ai"
                  width={36}
                  height={36}
                  className="dark:hidden"
                />
                <Image
                  src={MiraWhite}
                  alt="Mira ai"
                  width={36}
                  height={36}
                  className="hidden dark:block"
                />

                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">GitStark</span>
                  <span className="">v{info?.version}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <History className="mr-2" /> History
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {query?.isPending ? (
                <div>
                  {Array.from({ length: 5 }).map((_, _index) => (
                    <div key={`skeleton-item${_index}`}></div>
                    // <SidebarMenuItem key={`skeleton-item${_index}`}>
                    //   <SidebarMenuSkeleton />
                    // </SidebarMenuItem>
                  ))}
                </div>
              ) : (
                <div>
                  {agents?.map((agent: { id: UUID; name: string }) => (
                    <SidebarMenuItem key={agent.id}>
                      <Link href={`/chat/${agent.id}`}>
                        <SidebarMenuButton
                          isActive={pathname.includes(agent.id)}
                        >
                          <User />
                          <span>{agent.name}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="https://elizaos.github.io/eliza/docs/intro/"
              target="_blank"
            >
              <SidebarMenuButton>
                <Github /> Github
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Cog /> Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {/* <SidebarMenuButton>
              <ModeToggle />
            </SidebarMenuButton> */}
          </SidebarMenuItem>
          {/* <ConnectionStatus /> */}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
