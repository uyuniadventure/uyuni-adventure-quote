// @vitest-environment node
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";

const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({
  db: {
    rpc: (name: string, args: Record<string, unknown> = {}) => transport.client!.rpc(name, args),
  },
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  },
}));
import { listAdminUsers } from "./users";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let seed: string;
const ids = { admin: randomUUID(), operacion: randomUUID(), vendedor: randomUUID() };
const emails = {
  admin: "admin@example.invalid",
  operacion: "operacion@prueba.local",
  vendedor: "vendedor@prueba.local",
};
const runSeed = async () => {
  try {
    await pg.exec(seed);
  } catch (error) {
    await pg.exec("rollback");
    throw error;
  }
};
const as = async (role: keyof typeof ids) => {
  await pg.exec("set role authenticated");
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[role]]);
};
beforeAll(async () => {
  pg = await createDatabase();
  transport.client = pgliteSupabase(pg);
  seed = await readFile(
    new URL("../../../supabase/seed/test_role_profiles.sql", import.meta.url),
    "utf8",
  );
}, 120_000);
beforeEach(async () => {
  await pg.exec("reset role");
  await pg.query("delete from auth.users where id=any($1::uuid[])", [Object.values(ids)]);
  for (const role of Object.keys(ids) as (keyof typeof ids)[]) {
    await pg.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())", [
      ids[role],
      emails[role],
    ]);
  }
  await pg.query("update profiles set role='admin' where id=$1", [ids.admin]);
});
afterAll(async () => {
  await pg?.close();
});

describe("T18: seed manual de perfiles", () => {
  it("asigna ambos roles y se puede repetir sin cambiar nombres ni al Admin", async () => {
    await pg.query("update profiles set full_name='Nombre conservado' where id=$1", [
      ids.operacion,
    ]);
    await runSeed();
    await runSeed();
    await as("admin");
    const users = await listAdminUsers();
    expect(users).toHaveLength(3);
    for (const role of Object.keys(ids) as (keyof typeof ids)[]) {
      expect(users.find((u) => u.id === ids[role])).toMatchObject({ role, email: emails[role] });
    }
    expect(users.find((u) => u.id === ids.operacion)?.full_name).toBe("Nombre conservado");
  });
  it("si falta una cuenta, no cambia el rol de la otra", async () => {
    await pg.query("delete from auth.users where id=$1", [ids.vendedor]);
    await expect(runSeed()).rejects.toThrow("Crea y confirma en Auth");
    const { rows } = await pg.query<{ role: string }>("select role from profiles where id=$1", [
      ids.operacion,
    ]);
    expect(rows[0]?.role).toBe("vendedor");
  });
  it("exige que las dos cuentas estén confirmadas", async () => {
    await pg.query("update auth.users set email_confirmed_at=null where id=$1", [ids.vendedor]);
    await expect(runSeed()).rejects.toThrow("Crea y confirma en Auth");
    const { rows } = await pg.query<{ role: string }>("select role from profiles where id=$1", [
      ids.operacion,
    ]);
    expect(rows[0]?.role).toBe("vendedor");
  });
  it("no degrada una cuenta Admin ni aplica la otra mitad del seed", async () => {
    await pg.query("update profiles set role='admin' where id=$1", [ids.vendedor]);
    await expect(runSeed()).rejects.toThrow("ya es Admin");
    await as("admin");
    const users = await listAdminUsers();
    expect(users.find((u) => u.id === ids.vendedor)?.role).toBe("admin");
    expect(users.find((u) => u.id === ids.operacion)?.role).toBe("vendedor");
  });
  it("crea un perfil faltante sin inventar cuentas en Auth", async () => {
    await pg.query("delete from profiles where id=$1", [ids.operacion]);
    await runSeed();
    await as("admin");
    expect(await listAdminUsers()).toContainEqual(
      expect.objectContaining({ id: ids.operacion, role: "operacion" }),
    );
  });
});

describe("T18: lectura de usuarios mediante lib + Supabase/PGlite", () => {
  it("Admin recibe los emails actuales de Auth y solo los campos públicos previstos", async () => {
    await runSeed();
    await pg.query("update auth.users set email='changed@example.invalid' where id=$1", [
      ids.operacion,
    ]);
    await as("admin");
    const users = await listAdminUsers();
    expect(users.find((u) => u.id === ids.operacion)?.email).toBe("changed@example.invalid");
    expect(Object.keys(users[0]!).sort()).toEqual([
      "created_at",
      "email",
      "full_name",
      "id",
      "role",
    ]);
    await expect(pg.query("select * from auth.users")).rejects.toThrow("permission denied");
  });
  it.each(["vendedor", "operacion"] as const)(
    "%s no puede consultar emails ni ejecutar el seed",
    async (role) => {
      await runSeed();
      await as(role);
      await expect(listAdminUsers()).rejects.toThrow("Solo Admin");
      await expect(runSeed()).rejects.toThrow("permission denied");
      await expect(pg.query("select * from auth.users")).rejects.toThrow("permission denied");
    },
  );
  it("anon no puede ejecutar la RPC", async () => {
    await pg.exec("set role anon");
    await expect(listAdminUsers()).rejects.toThrow("permission denied");
  });
});
