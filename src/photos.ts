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

/** Tono estable por nombre, para que un hueco sin foto no se vea vacío. */
const TONES = ["#243044", "#2A221C", "#1C2A28", "#2A2430", "#1B2430"];

export function fallbackTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
