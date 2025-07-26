"use client";

import { usePathname } from "next/navigation";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import {
  HomeIcon, Sparkles, UserRound
} from "lucide-react";

const navigationItems = [
  { path: "/app", label: "Home", icon: HomeIcon, mobileHidden: true },
  { path: "/app/chatbot", label: "AI Assistant", icon: Sparkles, mobileHidden: true },
  { path: "/app/profile", label: "Profile", icon: UserRound, mobileHidden: true },
];

export function NavigationItems() {
  const pathname = usePathname();

  return (
    <>
      {navigationItems.map((item) => (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton asChild isActive={pathname === item.path}>
            <a href={item.path}>
              <item.icon />
              <span className="hidden md:flex">{item.label}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}
