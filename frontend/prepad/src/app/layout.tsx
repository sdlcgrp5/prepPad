import type { Metadata } from 'next';
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '700', '900']
});

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
      <body
        className={`${hankenGrotesk.variable}antialiased`}
      >
        <SessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
