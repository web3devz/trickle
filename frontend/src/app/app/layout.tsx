import type { Metadata } from "next";
import "../globals.css";

import Image from "next/image";

import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NavigationItems } from "@/components/nav-items";
import { SignIn } from "@/components/auth/sign-in";
import { WebhookListener } from "@/components/webhook-listener";


export const metadata: Metadata = {
  title: "App Page",
  description: "Your crypto dashboard",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <div className="relative flex w-full">
          <Sidebar>
            <SidebarGroupLabel className="pt-12 pb-24 md:flex hidden">
              <div className="flex items-center justify-center md:justify-between space-x-3">
                <Image
                  src="/trickle_icon.png"
                  alt="Trickle Logo"
                  width={40}
                  height={48}
                  className="w-6 h-8 md:w-10 md:h-14"
                />
                <h1 className='font-medium text-2xl'>Trickle</h1>
              </div>
            </SidebarGroupLabel>
            <SidebarContent>
              <SidebarGroup className="p-0">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-3">
                    <NavigationItems />
                    <SignIn />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 h-full w-full p-2 md:p-0 ml-0 md:ml-[16rem]">{children}</main>
          <WebhookListener />
          <Toaster />
        </div>
      </SidebarProvider>
    </div>
  );
}
