// @vitest-environment node
import { it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { htmlToPdfNodes, ProposalDocument } from "./proposal-document";
import { Children, isValidElement, type ReactNode } from "react";
const visible = (node: ReactNode): string =>
  Children.toArray(node)
    .map((v) =>
      typeof v === "string" || typeof v === "number"
        ? String(v)
        : isValidElement<{ children?: ReactNode }>(v)
          ? visible(v.props.children)
          : "",
    )
    .join(" ");
it("renderiza el subconjunto completo con el motor PDF existente", async () => {
  const html =
    '<h2>Título</h2><h3>Subtítulo</h3><p class="align-center">Texto <strong>fuerte</strong> <em>cursivo</em> <u>subrayado</u><br>segunda línea <a href="https://example.invalid">enlace</a></p><ul><li>Uno</li><li>Dos</li></ul><ol><li>Tres</li></ol><hr><table><tbody><tr><th>Hotel</th><th>Noche</th></tr><tr><td>Prueba</td><td>1</td></tr></tbody></table>';
  const nodes = htmlToPdfNodes(html);
  expect(visible(nodes)).toContain("Prueba");
  const bytes = await renderToBuffer(<ProposalDocument html={html} />);
  expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  expect(bytes.length).toBeGreaterThan(1500);
});
