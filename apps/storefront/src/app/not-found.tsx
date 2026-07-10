import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground"
        >
          Back to home
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium"
        >
          Shop all
        </Link>
      </div>
    </div>
  );
}
