import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Search, Share2, Bell, Shield, Upload } from "lucide-react";

export const metadata: Metadata = {
  title: "CuraVault",
  description: "Secure Medical Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col relative">
        {/* Top Nav */}
        <header className="sticky top-0 z-50 border-b border-[#1c2744]/80 bg-[#0a0e1a]/90 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-shadow">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">CuraVault</span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              <NavItem href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Timeline" />
              <NavItem href="/upload" icon={<Upload className="w-4 h-4" />} label="Upload" />
              <NavItem href="/search" icon={<Search className="w-4 h-4" />} label="Search" />
              <NavItem href="/share" icon={<Share2 className="w-4 h-4" />} label="Share" />
              <NavItem href="/reminders" icon={<Bell className="w-4 h-4" />} label="Reminders" />
            </nav>

            {/* Profile pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#151d35] border border-[#1c2744] rounded-full pl-1 pr-3 py-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-[10px] font-bold text-[#0a0e1a]">A</div>
                <span className="text-xs font-medium text-[#8494b0]">Patient</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative z-10 pb-20">{children}</main>
      </body>
    </html>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#5a6d8f] hover:text-[#22d3ee] hover:bg-[#151d35] rounded-lg transition-all duration-200"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
