import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import NavBar from "@/components/nav";
import QueryProviders from "@/providers/query";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import StarknetProvider from "@/components/starknet-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gitstark",
  description:
    "AI-Powered GitHub Assistant and Starknet and LORDS Tokens Rewarding Bot",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <StarknetProvider>
              <SidebarProvider>
                {session?.accessToken ? <AppSidebar /> : null}
                <main className=" w-full relative">
                  <NavBar />
                  {children}
                </main>
              </SidebarProvider>
            </StarknetProvider>
          </ThemeProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
