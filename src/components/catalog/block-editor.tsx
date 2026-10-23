import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Enums, Tables } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, StatusBadge, cap } from "./shared";
import {
  Field, IT_MODALITIES, SaveStateIndicator, SearchPicker, TranslationsPanel, canEditCatalogRow, catalogWriteErrorMessage, fetchModules, fetchServices,
  type SaveState,
  useLocationCodes, type PickOption,
} from "./kit";
import { TriState } from "./module-editor";
import { CatalogDeleteButton } from "./catalog-actions";
import { parseSuggestedPosition } from "./block-editor-utils";
import { eligibleHotelRooms, listHotels } from "@/lib/catalog/hotels";

type HotelOption = PickOption & { supplierId: string | null; unavailable?: boolean };

const hotelOption = (hotel: Awaited<ReturnType<typeof listHotels>>[number]): HotelOption => ({
  id: hotel.id,
  label: hotel.label,
  ...(hotel.code ? { sub: hotel.code } : {}),
  supplierId: hotel.supplier_id,
});

async function fetchHotels(term: string): Promise<HotelOption[]> {
  const normalized = term.trim().toLocaleLowerCase();
  const hotels = await listHotels();
  return hotels
    .map(hotelOption)
    .filter((hotel) => !normalized || `${hotel.label} ${hotel.sub ?? ""}`.toLocaleLowerCase().includes(normalized));
}

type Mut = () => PromiseLike<{ error: { message: string } | null }>;
function useRun(key: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fns: Mut[]) => {
      for (const fn of fns) {
        const { error } = await fn();
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function BlockEditor({ id, onClose, onCreated }: { id: string | null; onClose: () => void; onCreated: (id: string) => void }) {
  const isNew = id === "new";
  const [activeTab, setActiveTab] = useState("datos");
  const [dirty, setDirty] = useState(false);
  const { user, role } = useCurrentUser();
  const q = useQuery({
    queryKey: ["day_block", id],
    enabled: !!id && !isNew,
    queryFn: async () => {
      const [{ data, error }, hotels] = await Promise.all([
        db.from("day_blocks").select("*, services(id, sku, name), day_block_translations(lang, title)").eq("id", id!).single(),
        listHotels(),
      ]);
      if (error) throw error;
      const modernHotel = hotels.find((hotel) => hotel.id === data.hotel_id);
      return {
        ...data,
        modernHotel: modernHotel ? hotelOption(modernHotel) : data.hotel_id ? { id: data.hotel_id, label: "Hotel no disponible", supplierId: null, unavailable: true } : null,
      };
    },
  });
  const row = isNew ? null : q.data;
  const canEdit = canEditCatalogRow(role, user.id, row);
  const title = row ? (row.day_block_translations.find((t) => t.lang === "es") ?? row.day_block_translations[0])?.title : null;
  useEffect(() => {
    setActiveTab("datos");
    setDirty(false);
  }, [id]);
  const requestClose = () => {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos y cerrar?")) return;
    setDirty(false);
    onClose();
  };
  const changeTab = (value: string) => {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")) return;
    setDirty(false);
    setActiveTab(value);
  };

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && requestClose()}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-4xl"
        onEscapeKeyDown={(e) => {
          if (dirty) {
            e.preventDefault();
            requestClose();
          }
        }}
        onPointerDownOutside={(e) => {
          if (dirty) {
            e.preventDefault();
            requestClose();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>{isNew ? "Nuevo bloque diario" : title || row?.code || "Bloque"}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{row?.code ?? "Un día de itinerario: módulos, servicios sueltos y textos."}</SheetDescription>
        </SheetHeader>
        {isNew ? (
          <div className="mt-4">
            <BlockForm row={null} hotel={null} legacyHotel={null} canEdit={canEdit} onDirtyChange={setDirty} onSaved={onCreated} />
          </div>
        ) : !row ? (
          <p className="mt-6 text-sm text-muted-foreground">{q.isError ? "No se pudo cargar el bloque." : "Cargando…"}</p>
        ) : (
          <Tabs value={activeTab} onValueChange={changeTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="datos">Datos</TabsTrigger>
              <TabsTrigger value="textos">Textos</TabsTrigger>
              <TabsTrigger value="servicios">Servicios sueltos</TabsTrigger>
            </TabsList>
            <TabsContent value="datos" className="mt-4">
              <BlockForm
                key={row.id}
                row={row}
                hotel={row.modernHotel}
                legacyHotel={row.services ? { id: row.services.id, label: row.services.name, sub: row.services.sku } : null}
                canEdit={canEdit}
                onDirtyChange={setDirty}
                onSaved={() => {}}
              />
            </TabsContent>
            <TabsContent value="textos" className="mt-4">
              <TranslationsPanel kind="day_block" parentId={row.id} canEdit={canEdit} onDirtyChange={setDirty} />
            </TabsContent>
            <TabsContent value="modulos" className="mt-4">
              <BlockModules blockId={row.id} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="servicios" className="mt-4">
              <BlockItems
                blockId={row.id}
                hotelId={row.hotel_id}
                hotelSupplierId={row.modernHotel?.supplierId ?? null}
                hotelUnavailable={row.modernHotel?.unavailable ?? false}
                legacyHotelServiceId={row.hotel_service_id}
                canEdit={canEdit}
              />
            </TabsContent>
          </Tabs>
        )}
        {row && <CatalogDeleteButton kind="day_blocks" record={{ id: row.id, code: row.code, name: title || row.code }} onDeleted={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function BlockForm({
  row,
  hotel: hotel0,
  legacyHotel,
  canEdit,
  onSaved,
  onDirtyChange,
}: {
  row: Tables<"day_blocks"> | null;
  hotel: HotelOption | null;
  legacyHotel: PickOption | null;
  canEdit: boolean;
  onSaved: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { user, role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const qc = useQueryClient();
  const locs = useLocationCodes();
  const savingRef = useRef(false);
  const [hotel, setHotel] = useState<HotelOption | null>(hotel0);
  const [f, setF] = useState({
    code: row?.code ?? "",
    route_from: row?.route_from ?? "",
    route_to: row?.route_to ?? "",
    places: (row?.places ?? []).join(", "),
    modality: row?.modality ?? ("privado" as Enums<"itinerary_modality">),
    default_day_position: row?.default_day_position?.toString() ?? "",
    status: row?.status ?? ("pendiente" as Enums<"catalog_status">),
  });
  const snapshot = (values: typeof f, selectedHotel: HotelOption | null) => JSON.stringify({ ...values, hotel: selectedHotel?.id ?? null });
  const [baseline, setBaseline] = useState(() => snapshot(f, hotel0));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = snapshot(f, hotel) !== baseline;
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    onDirtyChange(true);
    setSaveState("dirty");
    setSaveError(null);
  };
  const selectHotel = (value: HotelOption | null) => {
    setHotel(value);
    onDirtyChange(true);
    setSaveState("dirty");
    setSaveError(null);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!f.code.trim()) throw new Error("El código es obligatorio.");
      const pos = parseSuggestedPosition(f.default_day_position);
      const values = {
        code: f.code.trim().toUpperCase(),
        route_from: f.route_from || null,
        route_to: f.route_to || null,
        places: f.places
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        modality: f.modality,
        default_day_position: pos,
        status: manager ? f.status : ("pendiente" as const),
      };
      if (row) {
        const hotelAssignment = row.hotel_id === null && row.hotel_service_id === null && hotel
          ? { hotel_id: hotel.id }
          : {};
        const { error } = await db.from("day_blocks").update({ ...values, ...hotelAssignment }).eq("id", row.id);
        if (error) throw error;
        return row.id;
      }
      const { data, error } = await db
        .from("day_blocks")
        .insert({ ...values, hotel_id: hotel?.id ?? null, created_by: user.id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      const normalized = {
        ...f,
        code: f.code.trim().toUpperCase(),
        default_day_position: parseSuggestedPosition(f.default_day_position)?.toString() ?? "",
      };
      setF(normalized);
      setBaseline(snapshot(normalized, hotel));
      onDirtyChange(false);
      setSaveState("saved");
      setSaveError(null);
      toast.success("Bloque guardado.");
      qc.invalidateQueries({ queryKey: ["day_blocks"] });
      qc.invalidateQueries({ queryKey: ["day_block", id] });
      qc.invalidateQueries({ queryKey: ["import-review"] });
      onSaved(id);
    },
    onError: (error: unknown) => {
      const message = catalogWriteErrorMessage(error, "Ya existe un bloque con ese código.");
      setSaveState("error");
      setSaveError(message);
      toast.error(message);
    },
  });

  const submit = () => {
    if (savingRef.current || save.isPending) return;
    savingRef.current = true;
    setSaveState("saving");
    setSaveError(null);
    save.mutate(undefined, {
      onSettled: () => {
        savingRef.current = false;
      },
    });
  };

  const locSelect = (k: "route_from" | "route_to") => (
    <Select value={f[k] || "none"} onValueChange={(v) => set(k, v === "none" ? "" : v)} disabled={!canEdit}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {locs.data?.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.code} · {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Código">
          <Input aria-label="Código" value={f.code} onChange={(e) => set("code", e.target.value)} disabled={!canEdit} />
        </Field>
        <Field label="Posición sugerida (día)">
          <Input aria-label="Posición sugerida (día)" inputMode="numeric" value={f.default_day_position} onChange={(e) => set("default_day_position", e.target.value)} disabled={!canEdit} />
        </Field>
        <Field label="Desde">{locSelect("route_from")}</Field>
        <Field label="Hasta">{locSelect("route_to")}</Field>
        <Field label="Lugares (separados por coma)" className="sm:col-span-2">
          <Input value={f.places} onChange={(e) => set("places", e.target.value)} placeholder="San Pedro de Atacama, Valle de la Luna" disabled={!canEdit} />
        </Field>
        <Field label="Hotel (define la variante)">
          {row?.hotel_service_id && !row.hotel_id ? (
            <div className="space-y-1">
              <div className="rounded-md border px-3 py-2 text-sm">
                <div>{legacyHotel?.label ?? "Servicio de hotel no disponible"}</div>
                {legacyHotel?.sub && <div className="font-mono text-xs text-muted-foreground">{legacyHotel.sub}</div>}
              </div>
              <p className="text-xs text-muted-foreground">Asociación heredada. Se conservará sin convertirla automáticamente.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <SearchPicker
                placeholder="Sin hotel"
                value={hotel}
                onPick={(option) => selectHotel(option as HotelOption | null)}
                queryKey="hotel-codes"
                fetcher={fetchHotels}
                disabled={!canEdit || !!row?.hotel_id}
              />
              {row?.hotel_id && <p className="text-xs text-muted-foreground">Para cambiar de hotel, crea otro bloque diario.</p>}
              {hotel?.unavailable ? (
                <p role="alert" className="text-xs text-brand-orange-deep">No se pudo cargar la información de este hotel. La asociación se conservará sin cambios.</p>
              ) : hotel && !hotel.supplierId ? (
                <p role="alert" className="text-xs text-brand-orange-deep">Este hotel no tiene proveedor asociado. No se podrán añadir habitaciones hasta completar su configuración.</p>
              ) : null}
            </div>
          )}
        </Field>
        <Field label="Modalidad">
          <Select value={f.modality} onValueChange={(v) => set("modality", v as Enums<"itinerary_modality">)} disabled={!canEdit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IT_MODALITIES.map((m) => (
                <SelectItem key={m} value={m}>
                  {cap(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Estado">
          {manager ? (
            <Select value={f.status} onValueChange={(v) => set("status", v as Enums<"catalog_status">)} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {cap(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="pt-1">
              <StatusBadge status={f.status} />
            </div>
          )}
        </Field>
      </div>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Guardando…" : row ? "Guardar cambios" : "Crear bloque"}
          </Button>
          <SaveStateIndicator state={saveState === "dirty" && !dirty ? "idle" : saveState === "idle" && dirty ? "dirty" : saveState} error={saveError} />
        </div>
      )}
    </div>
  );
}

function BlockModules({ blockId, canEdit }: { blockId: string; canEdit: boolean }) {
  const key = ["day_block_modules", blockId];
  const run = useRun(key);
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("day_block_modules").select("*, activity_modules(code, name, duration, default_time)").eq("block_id", blockId).order("order");
      if (error) throw error;
      return data;
    },
  });
  const rows = q.data ?? [];
  const move = (i: number, d: -1 | 1) => {
    const a = rows[i], b = rows[i + d];
    if (!a || !b) return;
    run.mutate([
      () => db.from("day_block_modules").update({ order: i + d }).eq("id", a.id),
      () => db.from("day_block_modules").update({ order: i }).eq("id", b.id),
    ]);
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <SearchPicker placeholder="Añadir módulo de actividad…" queryKey="modules" fetcher={fetchModules}
          onPick={async (o) => {
            if (!o) return;
            const { data } = await db.from("activity_modules").select("default_time").eq("id", o.id).single();
            run.mutate([() => db.from("day_block_modules").insert({ block_id: blockId, module_id: o.id, order: rows.length, time: data?.default_time ?? null })]);
          }} />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead className="w-20">Orden</TableHead><TableHead className="w-32">Hora</TableHead><TableHead>Módulo</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Sin módulos.</TableCell></TableRow>}
            {rows.map((m, i) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!canEdit || i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!canEdit || i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Input type="time" className="h-8" defaultValue={m.time?.slice(0, 5) ?? ""} disabled={!canEdit}
                    onBlur={(e) => (e.target.value || null) !== (m.time?.slice(0, 5) ?? null) &&
                      run.mutate([() => db.from("day_block_modules").update({ time: e.target.value || null }).eq("id", m.id)])} />
                </TableCell>
                <TableCell><div className="font-medium">{m.activity_modules?.name}</div><div className="font-mono text-xs text-muted-foreground">{m.activity_modules?.code}</div></TableCell>
                <TableCell className="text-right">
                  {canEdit && <Button size="icon" variant="ghost" onClick={() => run.mutate([() => db.from("day_block_modules").delete().eq("id", m.id)])}><Trash2 className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BlockItems({
  blockId,
  hotelId,
  hotelSupplierId,
  hotelUnavailable,
  legacyHotelServiceId,
  canEdit,
}: {
  blockId: string;
  hotelId: string | null;
  hotelSupplierId: string | null;
  hotelUnavailable: boolean;
  legacyHotelServiceId: string | null;
  canEdit: boolean;
}) {
  const key = ["day_block_items", blockId];
  const run = useRun(key);
  const modernHotel = !!hotelId;
  const legacyHotel = !hotelId && !!legacyHotelServiceId;
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("day_block_items").select("*, services(sku, name, type)").eq("block_id", blockId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const upd = (id: string, v: Partial<Tables<"day_block_items">>) => run.mutate([() => db.from("day_block_items").update(v).eq("id", id)]);
  const fetchRooms = async (term: string): Promise<PickOption[]> => {
    const normalized = term.trim().toLocaleLowerCase();
    const rooms = await eligibleHotelRooms(blockId);
    return rooms
      .filter((room) => room.status !== "inactivo")
      .filter((room) => !normalized || `${room.name} ${room.sku}`.toLocaleLowerCase().includes(normalized))
      .map((room) => ({ id: room.id, label: room.name, sub: room.sku }));
  };
  const addRoom = async (option: PickOption | null) => {
    if (!option) return;
    try {
      const rooms = await eligibleHotelRooms(blockId);
      if (!rooms.some((room) => room.id === option.id && room.status !== "inactivo")) {
        toast.error("La habitación ya no es compatible con el hotel del bloque.");
        return;
      }
      run.mutate([() => db.from("day_block_items").insert({ block_id: blockId, service_id: option.id, qty: 1, slot_key: "ALOJAMIENTO" })]);
    } catch (error) {
      toast.error(catalogWriteErrorMessage(error));
    }
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <SearchPicker placeholder={legacyHotel ? "Añadir servicio suelto (alojamiento, comida, traslado…)" : "Añadir servicio suelto (comida, traslado, entrada…)"} queryKey={legacyHotel ? "services" : "non-hotel-services"} fetcher={(t) => fetchServices(t, undefined, legacyHotel ? undefined : "alojamiento")}
          onPick={(o) => o && run.mutate([() => db.from("day_block_items").insert({ block_id: blockId, service_id: o.id, qty: 1 })])} />
      )}
      {canEdit && modernHotel && hotelSupplierId && (
        <SearchPicker placeholder="Añadir habitación compatible…" queryKey={`hotel-rooms-${blockId}`} fetcher={fetchRooms} onPick={addRoom} />
      )}
      {modernHotel && !hotelSupplierId && (
        <p role="alert" className="text-xs text-brand-orange-deep">
          {hotelUnavailable ? "No se pudo verificar el hotel asociado. La asociación se conservará sin cambios." : "El hotel no tiene proveedor asociado. No es posible seleccionar habitaciones compatibles."}
        </p>
      )}
      {!modernHotel && !legacyHotel && (
        <p className="text-xs text-muted-foreground">Asigna primero un hotel en Datos para poder añadir habitaciones.</p>
      )}
      <p className="text-xs text-muted-foreground">Los servicios marcados como “No incluido” aparecen en el “No incluye” del día (ej. cena libre).</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead className="w-20">Cant.</TableHead><TableHead>Incluido</TableHead><TableHead>Opcional</TableHead><TableHead>TC</TableHead><TableHead>Margen</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {q.data?.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Sin servicios sueltos.</TableCell></TableRow>}
            {q.data?.map((it) => (
              <TableRow key={it.id} className={it.included ? "" : "opacity-70"}>
                <TableCell>
                  <div className="font-medium">{it.services?.name ?? "Servicio eliminado"}</div>
                  <div className="font-mono text-xs text-muted-foreground">{it.services?.sku} {it.services && `· ${cap(it.services.type)}`}</div>
                </TableCell>
                <TableCell><Input type="number" min={0} step="any" defaultValue={it.qty} className="h-8" disabled={!canEdit}
                  onBlur={(e) => Number(e.target.value) !== it.qty && upd(it.id, { qty: Number(e.target.value) || 1 })} /></TableCell>
                <TableCell>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={it.included} onCheckedChange={(v) => upd(it.id, { included: v })} disabled={!canEdit} />
                    {it.included ? "Incluido" : "No incluido"}
                  </label>
                </TableCell>
                <TableCell><Switch checked={it.is_optional} onCheckedChange={(v) => upd(it.id, { is_optional: v })} disabled={!canEdit} /></TableCell>
                <TableCell><TriState value={it.applies_tc} onChange={(v) => upd(it.id, { applies_tc: v })} disabled={!canEdit} /></TableCell>
                <TableCell><TriState value={it.margin_applicable} onChange={(v) => upd(it.id, { margin_applicable: v })} disabled={!canEdit} /></TableCell>
                <TableCell>{canEdit && <Button size="icon" variant="ghost" onClick={() => run.mutate([() => db.from("day_block_items").delete().eq("id", it.id)])}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
