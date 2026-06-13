"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  SlidersHorizontal,
  Sparkles,
  UserRound
} from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { useAppState } from "@/state/AppState";

function getNavItems(username: string) {
  return [
    { label: "Home", href: "/home", icon: Home },
    { label: "Explore", href: "/explore", icon: Sparkles },
    { label: "Profile", href: `/profile/${username}`, icon: UserRound },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "Editor", href: "/editor", icon: SlidersHorizontal }
  ];
}

function isActive(pathname: string, href: string, ownProfileHref: string) {
  if (href.startsWith("/profile/")) {
    return pathname === ownProfileHref;
  }

  if (href === "/explore" && pathname.startsWith("/profile/")) {
    return pathname !== ownProfileHref;
  }

  if (href === "/messages") {
    return pathname.startsWith("/messages");
  }

  return pathname === href;
}

export function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useAppState();
  const navItems = getNavItems(currentUser.username);
  const ownProfileHref = `/profile/${currentUser.username}`;

  return (
    <nav className="bottom-tabbar" aria-label="Primary">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href, ownProfileHref);
        return (
          <Link key={href} href={href} className={active ? "active" : ""}>
            <Icon size={28} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { currentUser } = useAppState();
  const navItems = getNavItems(currentUser.username);
  const ownProfileHref = `/profile/${currentUser.username}`;

  return (
    <aside className="side-nav" aria-label="Primary">
      <Link href="/home" className="side-logo" aria-label="Blip home">
        <LogoMark />
      </Link>
      <div className="side-nav-items">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href, ownProfileHref);
          return (
            <Link key={href} href={href} className={active ? "active" : ""}>
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
