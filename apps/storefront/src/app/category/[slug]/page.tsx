import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

/** Legacy /category URLs redirect to /collections */
export default async function CategoryRedirect({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.page) qs.set("page", sp.page);
  if (sp.sort) qs.set("sort", sp.sort);
  const query = qs.toString();
  redirect(`/collections/${slug}${query ? `?${query}` : ""}`);
}
