import type { Metadata } from "next";
import { noIndexNoFollowMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexNoFollowMetadata;

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
