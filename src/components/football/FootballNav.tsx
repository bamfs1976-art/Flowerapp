"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/football", label: "Dashboard", icon: "📊" },
  { href: "/football/standings", label: "Standings", icon: "🏆" },
  { href: "/football/fixtures", label: "Fixtures", icon: "📅" },
  { href: "/football/bookings", label: "Bookings", icon: "🟨" },
];

export default function FootballNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/football" className="flex items-center gap-2.5 group">
            <span className="text-xl transition-transform duration-200 group-hover:scale-110">⚽</span>
            <span className="text-[15px] font-semibold tracking-tight text-white/90">
              Football<span className="text-emerald-400">Analytics</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/[0.04] rounded-xl p-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/football" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-0.5 bg-white/[0.04] rounded-xl p-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/football" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.1] text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
