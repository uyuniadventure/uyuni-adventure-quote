# Referencia LTd: 2 pasajeros

Implementación del 11 de octubre de 2026. La comparación está verificada en PostgreSQL local con las migraciones, seeds, funciones de guardado y políticas RLS del proyecto. **Todavía requiere aplicación y comprobación en Lovable Cloud**; no se ejecutó SQL remoto.

## Fuente y resultado esperado

Plantilla `UYUUYU-3D2N-LTd`, pestaña `*UYU UYU - 3D2N - LTd `, rango `A34:F64` de [Google Sheets](https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723). Valores y fórmulas leídos el 11 de octubre de 2026 y conservados en [la referencia JSON](fase0/references/uyuuyu-ltd-2pax.json).

- 2 pasajeros pagantes, 0 TC, 1 chofer, 0 guías.
- Noche 1: Luna Salada, una habitación twin standard sin vista al salar (`TWN_STD_NO_VIEW`).
- Noche 2: Tayka del Desierto, una habitación doble (`DBL`), más alojamiento y cena del chofer como ítems separados.
- Transporte: una compra de circuito por grupo, cobrada una sola vez por los tres días. La fuente no especifica por separado cantidad/modelo de vehículo; no se inventó una distribución de vehículos.
- Costo Sheets y app: **USD 1.475,00**; diferencia **USD 0,00**.
- La celda de precio de venta `D37` está vacía. El 25% lo confirmó el usuario y se aplica sobre el costo, según SPEC §6: **USD 1.843,75** total y **USD 921,88** por pasajero. No se atribuye ese precio de venta a Sheets. El margen se puede cambiar en el panel de cotización.

| Día | Celda | Servicio | Cantidad facturada | Costo USD |
|---|---|---|---:|---:|
| 1 | F48 | Circuito Uyuni–Uyuni 3D2N | 1 grupo | 690 |
| 1 | F49 | Almuerzo apthapi buffet | 2 personas | 40 |
| 1 | F50 | Entradas a parques | 2 personas | 60 |
| 1 | F51 | Cena Luna Salada | 2 personas | 80 |
| 1 | F52 | Habitación Luna Salada | 1 habitación | 221 |
| 2 | F54 | Circuito, cubierto por día 1 | 0 adicionales | 0 |
| 2 | F55 | Almuerzo plato servido | 2 personas | 30 |
| 2 | F56 | Cena chofer | 1 chofer | 30 |
| 2 | F57 | Habitación compartida chofer | 1 chofer | 30 |
| 2 | F58 | Cena pasajeros Tayka | 2 personas | 60 |
| 2 | F59 | Habitación doble Tayka | 1 habitación | 184 |
| 3 | F61 | Circuito, cubierto por día 1 | 0 adicionales | 0 |
| 3 | F62 | Almuerzo plato servido | 2 personas | 30 |
| 3 | F63 | Cóctel salar | 2 personas | 20 |
| | | **Total** | | **1.475** |

## Aplicación en Lovable Cloud: orden exacto

Prerequisito: el esquema histórico y los seeds `00`, `01` y `02` ya están aplicados, según el estado documentado del proyecto. No volver a ejecutarlos.

1. Aplicar `supabase/migrations/20261011000100_template_quote_defaults.sql`.
2. Ejecutar `supabase/seed/03_uyuuyu_ltd_2pax.sql` completo, en una transacción.
3. Desplegar el frontend de este PR después de la migración: consulta la nueva columna `quote_defaults`.
4. Realizar la comprobación manual descrita abajo con un usuario admin.

Los archivos UUID `20261006092542_…` y `20261006092618_…` ahora comprueban que existen los objetos de las migraciones canónicas 000600/000700. Conservan sus versiones y eliminan la segunda creación de objetos en instalaciones locales vacías. **No necesitan reejecución ni reparación del historial en Cloud**. No se omite ninguna migración en el runner local.

El nuevo seed reutiliza las tarifas maestras: no escribe `services` ni `service_rates`. Crea tres bloques exclusivos de esta referencia y enlaza únicamente esta plantilla. Conserva textos/revisión existentes y no aprueba automáticamente el catálogo. Si se repite después de aplicado, no repone ítems eliminados ni sobrescribe bloques, vínculos o configuración editados. Si los tres días o los SKU requeridos no existen, falla y revierte la transacción para permitir una reconciliación explícita.

## Comprobación manual

1. Como admin, abrir **Nueva cotización** con cliente de prueba, idioma español, origen/destino UYU, 3 días, fecha `2026-10-14`, 2 pagantes y 0 TC. Esta fecha se usa porque está dentro de las tarifas 2026; la fuente no fija una fecha de salida.
2. Seleccionar `UYUUYU-3D2N-LTd`. Deben aparecer tres días, las 14 líneas de la tabla, dos alojamientos de pasajeros y los dos servicios del chofer. Las cantidades por persona/habitación se muestran desde el cálculo.
3. Comprobar costo **1.475**, margen inicial **25%**, total **1.843,75** y por pasajero **921,88**. Cambiar el margen a 10% debe dar **1.622,50** sin cambiar el costo.
4. Guardar, ir a **Cotizaciones**, buscar por cliente/código y filtrar **Borrador**. Abrir **Continuar**: deben conservarse días, servicios, habitaciones, chofer y margen.
5. Opcionalmente sobrescribir el buffet a USD 21 por persona con una nota. El costo pasa a **1.477**, el cambio debe persistir al reabrir y la tarifa maestra seguir en USD 20.

El listado respeta RLS: cada vendedor ve sus cotizaciones y admin ve todas. Las archivadas se abren sin edición. Los borradores anteriores conservan sus snapshots; el seed no rellena retroactivamente cotizaciones que ya se crearon vacías.

## Validación automatizada y límites

Ejecutar `npm run test:db`, `npm run test`, `npm run typecheck` y `npm run build`.

`src/lib/quotes/reference.test.ts` crea una cotización mediante el código real de la aplicación y las funciones SQL de producción, usando PGlite como PostgreSQL local. El adaptador de transporte solo sustituye HTTP; no reimplementa cálculo ni guardado. Comprueba cada cantidad e importe, tolerancia total de ±1 USD, margen editable, persistencia al reabrir, búsqueda, RLS y repetición del seed. Un fallo muestra celda, servicio, costo Sheets, costo app y diferencia para todas las líneas. No comprueba la configuración HTTP/Auth del proyecto Cloud.

`src/components/quote/quote-list.test.tsx` comprueba el enlace al borrador correcto, filtros/paginación, errores recuperables y la diferencia entre total sin calcular y total cero.

`src/components/quote/quote-workspace.test.tsx` comprueba que las cotizaciones enviadas y archivadas muestran los importes guardados sin intentar recalcular o habilitar edición.

Esta referencia cubre únicamente 2 pagantes y 0 TC; otros escenarios no se habilitan en esta plantilla hasta tener su distribución. Las tres referencias históricas pendientes (SPA UYU MP, Bolivia 9+1 y SIVOLA) siguen omitidas por falta de fixtures completos y no se presentan como validadas. El catálogo conserva su revisión humana antes del uso por vendedores. No se amplía el selector, PDF, email ni operación en esta entrega.
