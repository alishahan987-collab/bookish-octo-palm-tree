/** Fetch helper for the admin. Throws Error(message) with the server's explanation. */
export class ApiFailure extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"),
    headers: opts.form ? undefined : opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    cache: "no-store",
    credentials: "same-origin",
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.endsWith("/login")) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new ApiFailure(json.error || `Request failed (${res.status})`, res.status, json.fields);
  return json as T;
}

export async function uploadImage(blob: Blob): Promise<{ url: string; path: string }> {
  const form = new FormData();
  form.append("file", blob, "image");
  const { file } = await api<{ file: { url: string; path: string } }>("/api/admin/media", { form });
  return file;
}
