export function validateTopic(t: string): string {
  // Strip HTML tags, trim, max 200 chars
  return t
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 200);
}

export function validateCaption(c: string): string {
  // Max 2200 chars (Instagram limit)
  return c.slice(0, 2200);
}

export function validateHashtags(tags: string[]): string[] {
  return tags
    .map((tag) => {
      const trimmed = tag.trim();
      // Add # prefix if missing
      return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    })
    .filter((tag) => /^#\w+$/.test(tag))
    .slice(0, 30);
}
