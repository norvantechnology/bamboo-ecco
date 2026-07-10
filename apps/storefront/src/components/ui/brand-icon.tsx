"use client";

import {
  Leaf,
  Sparkles,
  Home,
  Sprout,
  Hand,
  Truck,
  Recycle,
  ShieldCheck,
  Users,
  Package,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  leaf: Leaf,
  sparkles: Sparkles,
  home: Home,
  sprout: Sprout,
  hand: Hand,
  truck: Truck,
  recycle: Recycle,
  shield: ShieldCheck,
  users: Users,
  package: Package,
};

interface Props {
  name: string;
  className?: string;
}

/** Maps brand icon keys (from API) to Lucide icons. Falls back to Package. */
export function BrandIcon({ name, className }: Props) {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  const Icon = ICON_MAP[key] ?? ICON_MAP[name] ?? Package;
  return <Icon className={cn("icon-brand", className)} strokeWidth={1.5} aria-hidden />;
}
