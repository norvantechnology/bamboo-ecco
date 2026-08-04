import { useState } from "react";
import { ReviewManager } from "../components/ReviewManager";
import { PageHeader } from "../components/PageHeader";
import { LastUpdatedAt } from "../components/LastUpdatedAt";
import { JsonEditorButton } from "../components/JsonEditorModal";

export function ReviewsPage() {
  const [fetchedAt] = useState<string>(new Date().toISOString());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={
          <span className="flex items-center gap-3">
            <span>Add and approve customer reviews. Approved reviews appear on the homepage in “What Our Customers Say”.</span>
            <LastUpdatedAt date={fetchedAt} prefix="Data as of" />
          </span>
        }
        action={
          <JsonEditorButton
            data={{ statusFilter: "approved" }}
            lastUpdatedAt={fetchedAt}
            label="Reviews Page JSON"
            readOnly
          />
        }
      />
      <ReviewManager title="" description="" defaultFilter="approved" />
    </div>
  );
}
