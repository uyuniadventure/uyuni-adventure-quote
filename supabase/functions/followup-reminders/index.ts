import { admin, must, resend, response, secret, serve } from "../_shared/runtime.ts";
serve(async (request) => {
  const token = request.headers.get("x-cron-secret") ?? "";
  const digest = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const a = await digest(token),
    b = await digest(secret("FOLLOWUP_CRON_SECRET"));
  if (a.reduce((n, x, i) => n | (x ^ b[i]!), 0) !== 0)
    return response({ error: "Unauthorized" }, 401);
  const db = admin();
  const due = must(await db.rpc("due_followups")) as {
    seller_id: string;
    quote_id: string;
    code: string;
    scheduled_at: string;
    note: string;
  }[];
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const sellers = [...new Set(due.map((x) => x.seller_id))];
  const failures: string[] = [];
  let sent = 0;
  // Also retry durable pending rows if a follow-up was changed after the previous run.
  const pending = must(
    await db
      .from("followup_email_runs")
      .select("seller_id")
      .eq("day", day)
      .eq("status", "pendiente"),
  );
  for (const p of pending) if (!sellers.includes(p.seller_id)) sellers.push(p.seller_id);
  for (const seller of sellers) {
    try {
      const rows = must(
        await db.from("followup_email_runs").select("*").eq("seller_id", seller).eq("day", day),
      );
      let run = rows[0];
      if (!run) {
        const { data, error } = await db.auth.admin.getUserById(seller);
        if (error || !data.user?.email) throw new Error("Seller email missing");
        const lines = [
          ...new Set(
            due
              .filter((x) => x.seller_id === seller)
              .map(
                (x) =>
                  `${x.code} · ${new Date(x.scheduled_at).toLocaleString("es-CL", { timeZone: "America/Santiago" })} · ${x.note}`,
              ),
          ),
        ];
        const inserted = await db.from("followup_email_runs").upsert(
          {
            seller_id: seller,
            day,
            recipient: data.user.email,
            body: `Seguimientos de hoy y vencidos (${day})\n\n${lines.join("\n")}`,
          },
          { onConflict: "seller_id,day", ignoreDuplicates: true },
        );
        if (inserted.error) throw inserted.error;
        run = must(
          await db
            .from("followup_email_runs")
            .select("*")
            .eq("seller_id", seller)
            .eq("day", day)
            .single(),
        );
      }
      if (run.status === "enviado") continue;
      if (Date.now() - Date.parse(run.created_at) > 23 * 3600000)
        throw new Error("Provider reconciliation required");
      const receipt = await resend(
        {
          from: secret("RESEND_FROM"),
          to: [run.recipient],
          subject: `Seguimientos · ${day}`,
          text: run.body,
        },
        run.id,
      );
      const saved = await db
        .from("followup_email_runs")
        .update({ status: "enviado", provider_id: receipt, last_error: null })
        .eq("id", run.id);
      if (saved.error) throw saved.error;
      sent++;
    } catch {
      failures.push(seller);
    }
  }
  return response({ sent, failures }, failures.length ? 502 : 200);
});
