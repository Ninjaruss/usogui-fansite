import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import InitJQ from '@/components/InitJQ';
import AuthGate from '@/components/AuthGate';
import { UserProvider } from '@/context/UserContext';
import ToastProvider from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: "Usogui Fansite",
  description: "A fansite for the manga Usogui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <UserProvider>
          <ToastProvider>
            <InitJQ />
            <Header />
            <AuthGate>
              <main>{children}</main>
            </AuthGate>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
