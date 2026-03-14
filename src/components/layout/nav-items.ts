import { Home, BookOpen, Package, ShoppingBag, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  tutorialId: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home", tutorialId: "nav-home" },
  { href: "/patterns", icon: BookOpen, label: "Projects", tutorialId: "nav-patterns" },
  { href: "/threads", icon: Package, label: "Stash", tutorialId: "nav-stash" },
  { href: "/store-mode", icon: ShoppingBag, label: "Shop", tutorialId: "nav-shop" },
  { href: "/ai", icon: Sparkles, label: "AI", tutorialId: "nav-ai" },
];
