# Margen y comisión de agencia

Decisión de Andrea, 2026-10-11: valor global inicial **markup, 25 %**. La comisión inicial es **none, 0 %**.

## Motor puro

`src/lib/pricing/index.ts` usa la política de `policy.ts`, sin consultar la base ni depender de UI.

- `margin_pct`: porcentaje de la cotización. `null` o ausencia permiten heredar; `0` anula el margen.
- `client_pricing.margin_pct`: segunda prioridad.
- `admin_pricing.margin_pct`: tercera prioridad; configuración inicial 25.
- `margin_mode`: modo de la cotización o, en su ausencia, el global de Admin (`markup` inicial).
- `client_type: B2B`: habilita la comisión `client_pricing.commission_mode/pct`. Los campos superiores `commission_mode/pct` representan una política ya congelada en una cotización. `B2C` o tipo ausente no genera comisión.

Con costo elegible de USD 1.000, margen 25 % y sin redondeo adicional:

| Modo | Margen USD | Comisión USD | Total USD |
|---|---:|---:|---:|
| markup | 250,00 | 0,00 | 1.250,00 |
| margin_on_price | 333,33 | 0,00 | 1.333,33 |
| markup + gross 10 % | 250,00 | 138,89 | 1.388,89 |

La comisión gross se añade después del margen: `(costo + margen) / (1 - comisión / 100)`. También incluye los ítems no elegibles para margen; estos siguen teniendo margen cero. Solo los pasajeros pagantes dividen el total.

El resultado agrega `total_commission_usd`, `rounding_adjustment_usd` y `pricing_policy`. La comisión se calcula antes del redondeo comercial. El ajuste de redondeo permite reconciliar costo + margen + comisión con el total final. Los escenarios por pasajeros y suplementos single usan el mismo modo y comisión. Si falta un precio, los nuevos totales también son `null` y se mantiene el error existente.

`margin_on_price` y comisión requieren porcentajes finitos entre 0 incluido y 100 excluido; markup mantiene la compatibilidad con porcentajes de 100 o superiores.

## Persistencia y configuración

La migración `supabase/migrations/20261011000400_margin_and_agency_commission.sql` agrega:

- `pricing_settings`: un registro global, con lectura para el equipo y modificación solo por Admin mediante RLS.
- `clients.margin_pct` opcional y `clients.commission_pct/commission_mode` (comisión solo B2B).
- `quotes.margin_mode`, `quotes.commission_pct/commission_mode`, conservados en cada snapshot y versión.

La prioridad se resuelve atómicamente al crear la cotización. El creador deja de enviar un 25 fijo y permite heredar cliente/Admin. El porcentaje efectivo se guarda en `quotes.margin_pct`; las ediciones explícitas de la cotización conservan prioridad. Cambiar cliente/Admin no recalcula precios históricos ni modifica cotizaciones ya creadas. Las cotizaciones previas a la migración mantienen su porcentaje, modo markup, comisión none y cálculos guardados intactos.

Adaptadores disponibles para los formularios existentes en `src/lib/settings/pricing.ts`:

```ts
await getAdminPricingSettings();
await updateAdminPricingSettings({ margin_pct: 25, margin_mode: "markup" });
await updateClientPricingSettings(clientId, {
  margin_pct: null, // heredar Admin en nuevas cotizaciones
  commission_mode: "gross",
  commission_pct: 10,
});
```

Esta entrega implementa motor, configuración y persistencia. No agrega controles visuales en Admin o Clientes ni cambia el diseño del editor; esos controles pueden consumir los adaptadores anteriores. El campo de porcentaje que ya existe en la cotización continúa funcionando.

## Aplicación y validación

1. Partir de las migraciones de `main` hasta `20261011000300_quote_pricing_errors.sql` ya aplicadas. No volver a ejecutar la copia rack que exige 243 filas.
2. Aplicar **solo** `20261011000400_margin_and_agency_commission.sql`.
3. Desplegar el código y comprobar una nueva cotización B2B con comisión configurada. Guardar/reabrir debe conservar su desglose; cambiar valores globales o del cliente no debe alterar ese presupuesto.

No se ejecutan cambios contra Cloud desde Codex (AGENTS.md §10). La migración no modifica tarifas ni seeds históricos.

Pruebas: los tres importes solicitados, prioridad y cero explícito, margen selectivo, comisión solo B2B, rangos inválidos, escenarios, suplementos, redondeo, persistencia/reapertura, versiones, permisos RLS y conservación de cotizaciones anteriores. Los tests anteriores se ejecutan sin modificar sus fuentes ni expectativas; siguen existiendo tres casos históricos omitidos por datos fuente pendientes.
