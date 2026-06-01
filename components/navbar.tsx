"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Mail, Paperclip, MessageSquare, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/attachments", label: "Attachments", icon: Paperclip },
  { href: "/replies", label: "Replies", icon: MessageSquare },
];

export function Navbar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-medium font-heading text-xl">
          MailHQ
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                pathname === href
                  ? "bg-orange-50 text-orange-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
        <ThemeToggle />
        <form action={logout}>
          <button type="submit" className="btn-ghost p-2">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </nav>
  );
}
