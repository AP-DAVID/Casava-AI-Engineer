import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casava Help | Business Gro",
  description:
    "Late-night answers about Business Gro Insurance and Casava: coverage, cost, eligibility, apply, and claims.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
