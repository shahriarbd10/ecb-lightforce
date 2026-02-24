export function toEmbedUrl(input: string) {
  if (!input) return "";
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : input;
    }
    if (host.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : input;
    }
    if (host.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : input;
    }
    if (host.includes("facebook.com") || host.includes("fb.watch")) {
      // Normalize share/watch URLs first, then map to plugin embed format.
      const normalized = normalizeFacebookVideoUrl(url);
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        normalized
      )}&show_text=false&width=560`;
    }

    return input;
  } catch {
    return input;
  }
}

function normalizeFacebookVideoUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");

  // fb.watch/<id> -> facebook watch URL
  if (host.includes("fb.watch")) {
    const id = path.split("/").filter(Boolean)[0];
    return id ? `https://www.facebook.com/watch/?v=${id}` : url.toString();
  }

  // /share/v/<id> -> /watch/?v=<id>
  const shareMatch = path.match(/\/share\/v\/([^/]+)/i);
  if (shareMatch?.[1]) {
    return `https://www.facebook.com/watch/?v=${shareMatch[1]}`;
  }

  // Already watch URL with v param
  const watchId = url.searchParams.get("v");
  if (watchId) {
    return `https://www.facebook.com/watch/?v=${watchId}`;
  }

  return url.toString();
}
