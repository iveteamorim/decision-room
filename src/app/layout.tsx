import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DealRoomProvider } from "@/components/deal-room-provider";
import { DrWorkspaceNotice } from "@/components/dr-workspace-notice";
import { ViewerRoleProvider } from "@/components/viewer-role-provider";

export const metadata: Metadata = {
  title: "NOVUA Decision Room",
  description: "Decision workspace for pricing, discount, and approval governance.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DealRoomProvider>
          <ViewerRoleProvider>
            <DrWorkspaceNotice />
            {children}
          </ViewerRoleProvider>
        </DealRoomProvider>
      </body>
    </html>
  );
}
