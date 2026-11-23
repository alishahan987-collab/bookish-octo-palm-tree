import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-lux py-28 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-4 text-5xl">This page does not exist</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">The link may be out of date. You can explore our treatments or return home.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/treatments" className="btn btn-ghost">Treatments</Link>
      </div>
    </section>
  );
}
