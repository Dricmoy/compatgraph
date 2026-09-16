import type { Metadata } from "next";

import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  title: "Release intelligence",
};

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen bg-[#f3f4ee]">
      <DashboardSidebar />
      <div className="lg:pl-[246px]">{children}</div>
    </div>
  );
}
