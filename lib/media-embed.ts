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
      // Facebook videos should be public; plugin URL is the most reliable embeddable format.
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(input)}&show_text=false&width=560`;
    }

    return input;
  } catch {
    return input;
  }
}
