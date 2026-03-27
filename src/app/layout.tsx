import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Room",
  description: "Explainable decision engine for operational trade-offs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
