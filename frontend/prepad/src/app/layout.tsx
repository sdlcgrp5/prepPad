import type { Metadata } from 'next';
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: 'prePad | Your Seamless Job Application Optimizer',
   description: 'Optimize your Job Application process through seamless job weighted flow.'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
