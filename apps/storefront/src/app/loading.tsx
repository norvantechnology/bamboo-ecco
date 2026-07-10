import { PageLoader } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center py-16">
      <PageLoader label="Loading…" />
    </div>
  );
}
