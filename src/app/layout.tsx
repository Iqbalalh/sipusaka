import { Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { Metadata } from "next";
import SessionProviderWrapper from "@/components/wrapper/SessionWrapperProvider";
import { ThemeProvider } from "@/context/ThemeContext";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIPUSAKA",
  authors: [{ name: "Iqbal Al Hafidzu Rahman" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <SessionProviderWrapper>
          <ThemeProvider>
            <SidebarProvider>{children}
            </SidebarProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
