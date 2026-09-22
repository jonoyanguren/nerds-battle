export const SLOTS = 5;

export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const fmt = (n: number) => n.toLocaleString("es-ES");

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
