"use client";

import dynamic from "next/dynamic";
import type { CollectionData } from "@/lib/api";
import { PageLoader } from "@/components/ui/loading";

const CollectionStory = dynamic(
  () => import("./collection-story").then((m) => m.CollectionStory),
  {
    ssr: false,
    loading: () => <PageLoader label="Loading collection story…" />,
  },
);

export function CollectionStoryLoader({ data }: { data: CollectionData }) {
  return <CollectionStory data={data} />;
}
