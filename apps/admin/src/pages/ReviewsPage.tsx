import { ReviewManager } from "../components/ReviewManager";
import { PageHeader } from "../components/PageHeader";

export function ReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Add and approve customer reviews. Approved reviews appear on the homepage in “What Our Customers Say”."
      />
      <ReviewManager title="" description="" defaultFilter="approved" />
    </div>
  );
}
