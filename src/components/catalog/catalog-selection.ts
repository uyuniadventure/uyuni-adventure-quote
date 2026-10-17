import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CatalogRecord } from "./catalog-actions";

export async function readFilteredCatalogRecords(readPage: (offset: number, end: number) => Promise<CatalogRecord[]>) {
  const records: CatalogRecord[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await readPage(offset, offset + 499);
    records.push(...page);
    if (page.length < 500) return records;
  }
}

export function useCatalogSelection(key: unknown[], filterKey: string, enabled: boolean, readPage: (offset: number, end: number) => Promise<CatalogRecord[]>) {
  const [selection, setSelection] = useState<{ filter: string; ids: Set<string> }>({ filter: filterKey, ids: new Set() });
  const q = useQuery({ queryKey: [...key, "selection", filterKey], enabled, queryFn: () => readFilteredCatalogRecords(readPage) });
  const ids = selection.filter === filterKey ? selection.ids : new Set<string>();
  const records = (q.data ?? []).filter((r) => ids.has(r.id));
  useEffect(() => {
    setSelection((old) => {
      if (old.filter !== filterKey) return { filter: filterKey, ids: new Set() };
      if (!q.data) return old;
      const present = new Set(q.data.map((r) => r.id));
      const next = new Set([...old.ids].filter((id) => present.has(id)));
      return next.size === old.ids.size ? old : { filter: filterKey, ids: next };
    });
  }, [filterKey, q.data]);
  const toggle = (id: string, checked: boolean) => setSelection((old) => {
    const next = new Set(old.filter === filterKey ? old.ids : []);
    if (checked) next.add(id); else next.delete(id);
    return { filter: filterKey, ids: next };
  });
  const all = !!q.data?.length && records.length === q.data.length;
  return { ids, records, all, loading: q.isFetching, error: q.isError, ready: !!q.data && !q.isFetching && !q.isError, toggle, selectAll: (checked: boolean) => setSelection({ filter: filterKey, ids: new Set(checked ? q.data?.map((r) => r.id) : []) }), clear: () => setSelection({ filter: filterKey, ids: new Set() }) };
}