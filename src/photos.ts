export function photoUrl(template: string, photoId: string) {
  return template.replaceAll("{id}", encodeURIComponent(photoId));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}
