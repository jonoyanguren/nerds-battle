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
const TONES = ["#F3C7B6", "#F6D3A8", "#E7CDB8", "#F0C9C4", "#E4D2B4"];

export function fallbackTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
