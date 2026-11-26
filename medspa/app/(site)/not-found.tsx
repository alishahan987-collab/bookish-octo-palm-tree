import Link from "next/link";

export default function NotFound() {
  return (
    <section className="tone-ivory section">
      <div className="container-x max-w-2xl py-10 text-center">
        <p className="eyebrow mb-4">Page not found</p>
        <h1 className="text-5xl">We couldn&apos;t find that page</h1>
        <p className="mt-5 text-fg-muted">The page may have moved. Explore our treatments or contact us.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/treatments" className="btn btn-primary">Explore treatments</Link>
          <Link href="/contact" className="btn btn-outline">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
