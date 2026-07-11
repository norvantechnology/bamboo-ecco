/** Renders a JSON-LD script tag. Safe for server components. */
export function JsonLd({ data }: { data: object | object[] | null | undefined }) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (Array.isArray(payload) && payload.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
