import type { Enums } from "@/types/db";

export const OPS_STATUS: Record<Enums<"ops_status">, string> = {
  activo: "Activo", en_curso: "En curso", terminado: "Terminado", cancelado: "Cancelado",
};
export const BOOKING_STATUS: Record<Enums<"booking_status">, string> = {
  pendiente: "Pendiente", cotizacion_solicitada: "Cotización solicitada", reservado: "Reservado",
  confirmado: "Confirmado", cancelado: "Cancelado",
};
export const PAYABLE_STATUS: Record<Enums<"payable_status">, string> = {
  pendiente: "Pendiente", parcial: "Parcial", pagado: "Pagado",
};
export const usd = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `US$ ${Number(n).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const today = () => new Date().toISOString().slice(0, 10);
