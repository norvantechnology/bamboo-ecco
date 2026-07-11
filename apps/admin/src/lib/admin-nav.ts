import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  Image,
  Search,
  MessageSquare,
  FileText,
  LayoutTemplate,
  Megaphone,
} from "lucide-react";

export type NavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const dashboardNav: NavItem = {
  to: "/",
  icon: LayoutDashboard,
  label: "Dashboard",
  description: "Overview, stats, and quick links to everything",
};

export const navGroups: NavGroup[] = [
  {
    id: "shop",
    label: "Shop",
    items: [
      {
        to: "/products",
        icon: Package,
        label: "Products",
        description: "Add products, prices, photos, and lifestyle images",
      },
      {
        to: "/categories",
        icon: FolderTree,
        label: "Categories",
        description: "Organize collections shown on the homepage and shop",
      },
      {
        to: "/orders",
        icon: ShoppingCart,
        label: "Orders",
        description: "View and update customer orders",
      },
      {
        to: "/customers",
        icon: Users,
        label: "Customers",
        description: "Registered customer accounts",
      },
    ],
  },
  {
    id: "website",
    label: "Website",
    items: [
      {
        to: "/homepage",
        icon: LayoutTemplate,
        label: "Homepage",
        description: "Hero, sections, and what visitors see first",
      },
      {
        to: "/promotions",
        icon: Megaphone,
        label: "Promotions",
        description: "Welcome popup and announcement headline bar",
      },
      {
        to: "/content",
        icon: FileText,
        label: "Site pages",
        description: "About, policies, journal articles — text and SEO meta",
      },
      {
        to: "/media",
        icon: Image,
        label: "Media",
        description: "Image library and upload settings",
      },
      {
        to: "/reviews",
        icon: MessageSquare,
        label: "Reviews",
        description: "Approve reviews shown in “What Our Customers Say”",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      {
        to: "/seo",
        icon: Search,
        label: "SEO",
        description: "Search listing, Google verification, redirects",
      },
      {
        to: "/settings",
        icon: Settings,
        label: "Store settings",
        description: "Store name and general configuration",
      },
    ],
  },
];

/** Flat list for search and legacy imports */
export const allNavItems: NavItem[] = [
  dashboardNav,
  ...navGroups.flatMap((group) => group.items),
];

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return dashboardNav;
  return allNavItems.find((item) => item.to !== "/" && pathname.startsWith(item.to));
}

export function filterNavItems(query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.to.toLowerCase().includes(q),
  );
}
