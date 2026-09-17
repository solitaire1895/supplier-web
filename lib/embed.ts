/**
 * Converts a YouTube / Vimeo share URL into an embeddable player URL so
 * training videos play inside Nexusply instead of opening YouTube.
 * Returns null when the URL can't be embedded (unknown host) — callers
 * should then fall back to opening the original link.
 */
export function toEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;

  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    // YouTube watch / shorts / embed URLs
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (u.pathname === "/watch" && v) {
        return `https://www.youtube.com/embed/${encodeURIComponent(v)}?autoplay=1&rel=0`;
      }
      const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?autoplay=1&rel=0`;
      const embed = u.pathname.match(/^\/embed\/([\w-]+)/);
      if (embed) return `https://www.youtube.com/embed/${embed[1]}?autoplay=1&rel=0`;
      return null;
    }

    // youtu.be short links (e.g. https://youtu.be/ID?si=...) — the extra
    // tracking params are dropped automatically.
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      return null;
    }

    // Vimeo
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1`;
      return null;
    }

    return null;
  } catch {
    return null;
  }
}
