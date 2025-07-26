import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/auth-provider";
import { WebhookListener } from "@/components/webhook-listener";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Trickle",
  description: "Microinvesting for anyone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <AuthProvider>
          {children}
          {/* <WebhookListener />
          <Toaster /> */}
        </AuthProvider>
      </body>
    </html>
  );
}
