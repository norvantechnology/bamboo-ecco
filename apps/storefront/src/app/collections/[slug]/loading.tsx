import { PageLoader } from "@/components/ui/loading";

export default function CollectionLoading() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <PageLoader label="Loading items..." />
    </div>
  );
}
