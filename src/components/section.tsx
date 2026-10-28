import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  LayoutTemplate,
  CalendarDays,
  Layers,
  Tags,
  Building2,
  Users,
  Images,
  FileInput,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

export interface SectionDef {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const SECTIONS = {
  dashboard: {
    path: "/",
    title: "Dashboard",
    description: "Resumen general de cotizaciones, tarifas y operación del DMC.",
    icon: LayoutDashboard,
  },
  "nueva-cotizacion": {
    path: "/nueva-cotizacion",
    title: "Nueva cotización",
    description: "Crea una cotización desde cero o partiendo de una plantilla.",
    icon: FilePlus2,
  },
  cotizaciones: {
    path: "/cotizaciones",
    title: "Cotizaciones",
    description: "Busca, filtra y da seguimiento a todas las cotizaciones del equipo.",
    icon: ClipboardList,
  },
  plantillas: {
    path: "/plantillas",
    title: "Plantillas",
    description: "Itinerarios base reutilizables por destino, duración y tipo de viaje.",
    icon: LayoutTemplate,
  },
  "bloques-diarios": {
    path: "/bloques-diarios",
    title: "Bloques diarios",
    description: "Biblioteca de bloques de día para armar itinerarios multi-día.",
    icon: CalendarDays,
  },
  "modulos-actividad": {
    path: "/modulos-actividad",
    title: "Módulos de actividad",
    description: "Actividades, traslados y servicios encadenables entre bloques.",
    icon: Layers,
  },
  "bloques-documento": {
    path: "/bloques-documento",
    title: "Bloques de documento",
    description: "Textos y datos reutilizables para propuestas B2C y B2B.",
    icon: LayoutTemplate,
  },
  tarifario: {
    path: "/tarifario",
    title: "Tarifario",
    description: "Tarifas, temporadas y reglas de precios por servicio y proveedor.",
    icon: Tags,
  },
  proveedores: {
    path: "/proveedores",
    title: "Proveedores",
    description: "Operadores, hoteles y transportistas con sus contactos y acuerdos.",
    icon: Building2,
  },
  clientes: {
    path: "/clientes",
    title: "Clientes",
    description: "Agencias y viajeros finales con su historial de cotizaciones.",
    icon: Users,
  },
  media: {
    path: "/media",
    title: "Media",
    description: "Imágenes y videos organizados por destino, servicio y temporada.",
    icon: Images,
  },
  "revision-importacion": {
    path: "/revision-importacion",
    title: "Revisión de importación",
    description: "Valida y confirma los datos importados desde planillas externas.",
    icon: FileInput,
  },
  operacion: {
    path: "/operacion",
    title: "Operación",
    description: "Confirmaciones, órdenes de servicio y seguimiento de viajes activos.",
    icon: ClipboardCheck,
  },
  admin: {
    path: "/admin",
    title: "Admin",
    description: "Usuarios, roles y configuración general del cotizador.",
    icon: ShieldCheck,
  },
} satisfies Record<string, SectionDef>;

export const SECTION_GROUPS: { label: string | null; items: SectionDef[] }[] = [
  { label: null, items: [SECTIONS.dashboard] },
  {
    label: "Cotizaciones",
    items: [SECTIONS["nueva-cotizacion"], SECTIONS.cotizaciones, SECTIONS.plantillas],
  },
  {
    label: "Diseño del viaje",
    items: [
      SECTIONS["bloques-diarios"],
      SECTIONS["modulos-actividad"],
      SECTIONS["bloques-documento"],
      SECTIONS.tarifario,
    ],
  },
  {
    label: "Recursos",
    items: [SECTIONS.proveedores, SECTIONS.clientes, SECTIONS.media],
  },
  {
    label: "Gestión",
    items: [
      SECTIONS["revision-importacion"],
      SECTIONS.operacion,
      SECTIONS.admin,
    ],
  },
];

export function sectionHead(section: SectionDef) {
  return {
    meta: [
      { title: `${section.title} — Cotizador Uyuni Adventure` },
      { name: "description", content: section.description },
      { property: "og:title", content: `${section.title} — Cotizador Uyuni Adventure` },
      { property: "og:description", content: section.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}

export function SectionShell({ section }: { section: SectionDef }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange-deep">
          Uyuni Adventure DMC
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{section.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center sm:px-10 sm:py-24">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange-soft">
          <section.icon className="h-6 w-6 text-brand-orange-deep" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">En construcción</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Esta sección estará disponible próximamente. La estructura visual del cotizador se está
          preparando para conectar los datos.
        </p>
      </div>
    </div>
  );
}
