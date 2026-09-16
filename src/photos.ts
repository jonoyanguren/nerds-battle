export function headshotUrl(nbaId: number) {
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${nbaId}.png`;
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
