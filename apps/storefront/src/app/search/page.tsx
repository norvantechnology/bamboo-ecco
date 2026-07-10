import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import SearchPage from "./search-client";

export const metadata: Metadata = {
  title: "Search",
  ...noIndexMetadata,
};

export default function Page() {
  return <SearchPage />;
}
