# Configuración de habitaciones y vehículos

Decisión de Andrea, 2026-10-11: la ausencia de configuración en los enlaces día→servicio no debe bloquear una cotización ni dejar los hoteles en cero. Las reglas automáticas se explican con avisos en el panel existente.

## Contrato Zod

`src/lib/pricing/config.ts` exporta `pricingConfigSchema` (discriminado por unidad), `pricingConfigSchemas` y `parsePricingConfig` (admite campos ausentes para resolver defaults).

| Unidad | Configuración completa |
|---|---|
| per_room | `{room_type: "SGL" \| "DBL" \| "TPL" \| "MAT", nights: entero positivo}` |
| per_vehicle | `{vehicle_segment: "chile", rate_band?: {pax_min: número o null, pax_max: número o null}}` |
| per_person / per_group / per_unit | `{}` |
| per_staff | `{staff_type: "drivers" \| "guides"}` |

`rate_band` identifica un rango del tarifario, no un precio nuevo. Una configuración parcial `{}` permite defaults; valores inválidos (noches negativas, tipo desconocido, límites invertidos) no se aceptan. Los snapshots anteriores con campos planos siguen siendo compatibles. Los enlaces conservan descripción, unidad especial y referencias de origen fuera del objeto validado.

## Reglas y persistencia

- La cotización mantiene `rooming.paying` y `rooming.tc`. Cualquier distribución con cantidades positivas tiene prioridad; los ceros iniciales de la pantalla equivalen a ausencia. Se admiten mezclas como 1 TPL + 1 DBL para cinco pagantes.
- Sin distribución de pagantes: `floor(pax / 2)` DBL y `pax % 2` SGL. Sin distribución TC: un SGL por TC, separado de los pagantes y facturado solo si el ítem aplica al TC.
- Los alias TWN/DBL_TWN se interpretan como DBL; DBL_MAT como MAT. Se conservan las claves especiales usadas por la referencia LTd.
- Un enlace diario de alojamiento cubre una noche salvo `nights` explícito. Los servicios por variante usan únicamente su tipo; un servicio genérico (por ejemplo STANDARD) usa las habitaciones elegidas, seleccionando sus tarifas por tipo cuando existan. Sin tarifas diferenciadas se utiliza la tarifa genérica disponible, con aviso de la suposición.
- El número explícito de vehículos por segmento tiene prioridad, incluido cero. Cuando falta, se selecciona la tarifa vigente que cubre pagantes + TC + staff y se propone una unidad. Se conserva el filtro de fecha y temporada. Sin capacidad informada se exige revisión mediante aviso; con límites explícitos insuficientes no se escoge una tarifa más pequeña.
- `effective_rooming`, configuración resuelta, desglose por habitación y avisos quedan en el cálculo guardado. Los defaults no se escriben como decisiones manuales en `quotes.rooming`: al cambiar pax se recalculan; las distribuciones explícitas sí permanecen. Los escenarios se resuelven independientemente.
- No se inventan tarifas, no se modifica el catálogo y no se alteran cotizaciones enviadas al abrirlas. Sigue vigente el error de tarifa sin neto ni rack.

## Verificación y límites

Tests del motor con 2, 3, 9+1 y 16+1 pasajeros, dos miembros de staff, tarifas explícitas de prueba, variantes, noches, prioridad manual, escenarios, servicios multi-día, límites, fechas y Zod.

El test de integración carga migraciones y seeds reales locales, crea `SPAUYU-3D2N-MP` desde sus enlaces sin configuración, recalcula, guarda y reabre. Comprueba cada hotel y el total independiente por líneas. Para 2 pasajeros, salida 2026-10-14, CLP/USD 885 y markup 25 %: costo **USD 2.036,49**, venta **USD 2.545,61**, con avisos y sin errores. También prueba tres pasajeros y una distribución explícita de cuatro. La referencia LTd mantiene costo USD 1.475.

El criterio de esta entrega es cálculo completo y positivo con las tarifas importadas, no una nueva conciliación con Google Sheets. La plantilla SPAUYU conserva limitaciones del catálogo: varios servicios por grupo tienen tramos hasta seis pasajeros y el transfer hasta dieciséis. Los casos 9+1 y 16+1 prueban las reglas del motor con rangos conocidos; no certifican esa plantilla completa para esos grupos. Si se solicita TPL en un hotel cuyos enlaces solo tienen SGL/DBL, debe añadirse su tarifa real antes de calcular; no se omite ese alojamiento del costo.

## Despliegue

No requiere migración ni reimportación: se usan los JSON existentes. Integrar el PR y desplegar el código sobre main con sus migraciones ya aplicadas. En la app, crear SPAUYU-3D2N-MP para dos pasajeros con fecha dentro de la vigencia de las tarifas, mantener la distribución vacía y verificar importe y avisos; guardar/reabrir y luego probar distribución manual. No se realizaron escrituras en Cloud.
