"use client";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import NextTopLoader from "nextjs-toploader";

import React, { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { NotificationProvider } from "@/context/NotificationContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
        Memverifikasi otentikasi...
      </div>
    );
  }

  if (status === "authenticated") {
    const mainContentMargin = isMobileOpen
      ? "ml-0"
      : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

    return (
      <div className="min-h-screen xl:flex max-w-[100vw] overflow-x-hidden">
          {/* Loading indicator */}
          <NextTopLoader showSpinner={false} />

          {/* Sidebar and Backdrop */}
          <AppSidebar />
          <Backdrop />

          {/* Main Content Area */}
          <div
            className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} max-w-[100vw] overflow-x-hidden`}
          >
            <AppHeader />

            {/* Page Content */}
            <div className="p-4 mx-auto w-full max-w-[100vw] md:p-6 overflow-x-hidden">
              <App>
                <NotificationProvider>{children}</NotificationProvider>
              </App>
            </div>
          </div>
      </div>
    );
  }

  return null;
}
