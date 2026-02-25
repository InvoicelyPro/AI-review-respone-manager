import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewPro — AI Review Response Manager",
  description: "AI-powered review response management for service businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
