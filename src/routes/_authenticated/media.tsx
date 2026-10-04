import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SECTIONS, sectionHead } from "@/components/section";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { ALL, Field, Filter, PageHeader, primaryBtn, usePlaces } from "@/components/catalog/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const s = SECTIONS.media;
/** Bucket de Storage para fotos de lugares y hoteles. */
export const MEDIA_BUCKET = "media";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => sectionHead(s),
  component: MediaPage,
});

const TYPE_LABELS: Record<Enums<"media_type">, string> = { highlight: "Destacada (lugar)", alojamiento: "Alojamiento (hotel)" };

function useHotels() {
  return useQuery({
    queryKey: ["hotel-services"],
    queryFn: async () => {
      const { data, error } = await db.from("services").select("id, name, sku").eq("type", "alojamiento").neq("status", "inactivo").order("name").limit(1000);
      if (error) throw error;
      return data;
    },
  });
}

function MediaPage() {
  const { role } = useCurrentUser();
  const canEdit = canManageCatalog(role);
  const qc = useQueryClient();
  const places = usePlaces();
  const hotels = useHotels();
  const [type, setType] = useState(ALL);
  const [place, setPlace] = useState(ALL);
  const [hotel, setHotel] = useState(ALL);
  const [upload, setUpload] = useState(false);

  const q = useQuery({
    queryKey: ["media", type, place, hotel],
    queryFn: async () => {
      let query = db.from("media").select("*, places(name), services(name)").order("order").order("created_at", { ascending: false }).limit(300);
      if (type !== ALL) query = query.eq("type", type as Enums<"media_type">);
      if (place !== ALL) query = query.eq("place_id", place);
      if (hotel !== ALL) query = query.eq("service_id", hotel);
      const { data, error } = await query;
      if (error) throw error;
      const paths = data.map((m) => m.storage_path);
      const urls = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await db.storage.from(MEDIA_BUCKET).createSignedUrls(paths, 3600);
        signed?.forEach((x) => x.path && x.signedUrl && urls.set(x.path, x.signedUrl));
      }
      return data.map((m) => ({ ...m, url: urls.get(m.storage_path) ?? null }));
    },
  });

  const remove = useMutation({
    mutationFn: async (m: { id: string; storage_path: string }) => {
      const { error } = await db.from("media").delete().eq("id", m.id);
      if (error) throw error;
      await db.storage.from(MEDIA_BUCKET).remove([m.storage_path]);
    },
    onSuccess: () => { toast.success("Foto eliminada."); qc.invalidateQueries({ queryKey: ["media"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Media" subtitle="Fotos de lugares y hoteles para los PDF de cotización."
        action={canEdit && <Button className={primaryBtn} onClick={() => setUpload(true)}><Upload className="mr-1 h-4 w-4" />Subir fotos</Button>} />
      <div className="flex flex-wrap gap-2">
        <Filter value={type} onChange={setType} placeholder="Tipo" options={Object.entries(TYPE_LABELS)} wide />
        <Filter value={place} onChange={setPlace} placeholder="Lugar" options={(places.data ?? []).map((p) => [p.id, p.name])} wide />
        <Filter value={hotel} onChange={setHotel} placeholder="Hotel" options={(hotels.data ?? []).map((h) => [h.id, h.name])} wide />
      </div>
      {q.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {q.error && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
      {q.data?.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No hay fotos con estos filtros.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {q.data?.map((m) => (
          <figure key={m.id} className="group overflow-hidden rounded-lg border bg-card">
            <div className="relative aspect-[4/3] bg-muted">
              {m.url ? <img src={m.url} alt={m.places?.name ?? m.services?.name ?? "Foto"} className="h-full w-full object-cover" loading="lazy" />
                : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>}
              {canEdit && (
                <Button size="icon" variant="secondary" className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100" aria-label="Eliminar"
                  onClick={() => { if (confirm("¿Eliminar esta foto?")) remove.mutate(m); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <figcaption className="space-y-1 p-2.5">
              <div className="truncate text-sm font-medium">{m.places?.name ?? m.services?.name ?? "Sin asignar"}</div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{m.type === "highlight" ? "Lugar" : "Hotel"}</Badge>
                <span className="text-xs text-muted-foreground">#{m.order}</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {upload && <UploadDialog places={places.data ?? []} hotels={hotels.data ?? []} onClose={() => setUpload(false)} onDone={() => qc.invalidateQueries({ queryKey: ["media"] })} />}
    </div>
  );
}

function UploadDialog({ places, hotels, onClose, onDone }: {
  places: { id: string; name: string }[]; hotels: { id: string; name: string }[]; onClose: () => void; onDone: () => void;
}) {
  const [target, setTarget] = useState<"place" | "hotel">("place");
  const [targetId, setTargetId] = useState("");
  const [order, setOrder] = useState("0");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const list = target === "place" ? places : hotels;

  const submit = async () => {
    if (!targetId) { toast.error(`Elige ${target === "place" ? "un lugar" : "un hotel"}.`); return; }
    if (!files.length) { toast.error("Selecciona al menos una foto."); return; }
    setBusy(true);
    let ok = 0;
    for (const [i, f] of files.entries()) {
      const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${target === "place" ? "places" : "hotels"}/${targetId}/${crypto.randomUUID()}.${ext}`;
      const up = await db.storage.from(MEDIA_BUCKET).upload(path, f, { contentType: f.type });
      if (up.error) { toast.error(`${f.name}: ${up.error.message}`); continue; }
      const { error } = await db.from("media").insert({
        storage_path: path,
        type: target === "place" ? "highlight" : "alojamiento",
        place_id: target === "place" ? targetId : null,
        service_id: target === "hotel" ? targetId : null,
        order: Number(order || 0) + i,
      });
      if (error) { await db.storage.from(MEDIA_BUCKET).remove([path]); toast.error(`${f.name}: ${error.message}`); continue; }
      ok++;
    }
    setBusy(false);
    if (ok) { toast.success(`${ok} foto(s) subida(s).`); onDone(); onClose(); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Subir fotos</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Asignar a">
            <Select value={target} onValueChange={(v) => { setTarget(v as "place" | "hotel"); setTargetId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="place">Lugar (destacada)</SelectItem><SelectItem value="hotel">Hotel (alojamiento)</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label={target === "place" ? "Lugar" : "Hotel"}>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>{list.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Orden inicial"><Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} /></Field>
          <Field label="Fotos"><Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button className={primaryBtn} onClick={submit} disabled={busy}>{busy ? "Subiendo…" : "Subir"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
