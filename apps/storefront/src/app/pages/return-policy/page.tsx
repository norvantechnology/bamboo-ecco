import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Bamboo Eco-Hub offers free 30-day returns on all products. Learn about our hassle-free return policy, refund process, and exchange options.",
  alternates: { canonical: "/pages/return-policy" },
};

export default function ReturnPolicyPage() {
  const siteUrl = absoluteUrl("/");
  return (
    <div className="container-page max-w-3xl py-8 sm:py-14">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Return Policy", url: absoluteUrl("/pages/return-policy") },
        ]}
      />

      <h1 className="font-display text-2xl sm:text-4xl">Return &amp; Refund Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: July 2026</p>

      <div className="cms-content mt-8 space-y-8 text-sm leading-relaxed sm:text-base">

        <section>
          <h2 className="font-display text-xl sm:text-2xl">30-Day Free Returns</h2>
          <p className="mt-3">
            We want you to love your purchase. If you are not completely satisfied, you may
            return any item within <strong>30 days</strong> of delivery — no questions asked.
            Return shipping is free for all orders within India.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl">Eligibility</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1">
            <li>Item must be returned within 30 days of the delivery date.</li>
            <li>Item must be unused and in original packaging where possible.</li>
            <li>Defective or damaged items are eligible for return at any time.</li>
            <li>Custom or personalised orders are non-returnable unless defective.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl">How to Return</h2>
          <ol className="mt-3 list-decimal pl-5 space-y-2">
            <li>
              Email us at <a href="mailto:support@bambooecohub.com" className="underline">support@bambooecohub.com</a> with
              your order number and reason for return.
            </li>
            <li>We will send you a prepaid return shipping label within 24 hours.</li>
            <li>Pack the item securely and drop it at your nearest courier centre.</li>
            <li>
              Once we receive and inspect the item, your refund will be processed within
              <strong> 7 business days</strong>.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl">Refunds</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1">
            <li>Refunds are issued to the original payment method.</li>
            <li>UPI / bank transfer refunds: 3–5 business days.</li>
            <li>Credit / debit card refunds: 5–7 business days (depends on your bank).</li>
            <li>No restocking fees are charged.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl">Exchanges</h2>
          <p className="mt-3">
            We accept exchanges for a different product or variant of equal or greater value.
            To request an exchange, email us at{" "}
            <a href="mailto:support@bambooecohub.com" className="underline">
              support@bambooecohub.com
            </a>{" "}
            within 30 days of delivery.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl">Damaged or Defective Items</h2>
          <p className="mt-3">
            If your item arrives damaged or defective, please contact us within{" "}
            <strong>48 hours</strong> of delivery with photos. We will arrange a free
            replacement or full refund immediately.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl">Contact Us</h2>
          <p className="mt-3">
            For any return or refund queries:
          </p>
          <ul className="mt-2 list-none space-y-1">
            <li>
              📧 Email:{" "}
              <a href="mailto:support@bambooecohub.com" className="underline">
                support@bambooecohub.com
              </a>
            </li>
            <li>📍 Country: India</li>
            <li>⏰ Response time: Within 24 hours (Mon–Sat)</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
