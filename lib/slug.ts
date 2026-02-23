export function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildUniqueSlug(name: string) {
  const base = toSlug(name) || "player";
  const token = Math.random().toString(36).slice(2, 7);
  return `${base}-${token}`;
}
