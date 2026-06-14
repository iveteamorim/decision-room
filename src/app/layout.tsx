import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DealRoomProvider } from "@/components/deal-room-provider";

export const metadata: Metadata = {
  title: "NOVUA Decision Room",
  description: "AI-assisted decision support for pricing, discounts, and commercial approvals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DealRoomProvider>{children}</DealRoomProvider>
      </body>
    </html>
  );
}
