import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

export type HtmlNode = DefaultTreeAdapterMap["childNode"];
export const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export function safeLink(value: string): string | null {
  const url = value.trim();
  if (
    !/^(https?:\/\/|mailto:)/i.test(url) ||
    [...url].some((c) => c.charCodeAt(0) <= 32 || "<>\"'".includes(c))
  )
    return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
}
const allowed = new Set([
  "p",
  "h2",
  "h3",
  "strong",
  "em",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "br",
  "hr",
  "table",
  "tbody",
  "tr",
  "td",
  "th",
]);
const discard = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
  "form",
  "input",
  "img",
  "video",
  "audio",
]);
export function htmlNodes(html: string) {
  return parseFragment(html).childNodes;
}
/** HTML5 parsing, escaped text, and a closed attribute/tag list. Never a regex sanitizer. */
export function sanitizeProposalHtml(html: string): string {
  if (html.length > 50000) throw new Error("El texto supera los 50.000 caracteres.");
  const clean = (node: HtmlNode): string => {
    if (node.nodeName === "#text")
      return escapeHtml((node as DefaultTreeAdapterMap["textNode"]).value);
    if (!("tagName" in node)) return "";
    const original = node.tagName;
    if (discard.has(original)) return "";
    const tag =
      ({ b: "strong", i: "em", div: "p" } as Record<string, string>)[original] ?? original;
    const children = node.childNodes.map(clean).join("");
    if (!allowed.has(tag)) return children;
    const attrs: string[] = [];
    if (tag === "a") {
      const href = safeLink(node.attrs.find((a) => a.name === "href")?.value ?? "");
      if (href) attrs.push(`href="${escapeHtml(href)}"`);
    }
    if (["p", "h2", "h3", "td", "th"].includes(tag)) {
      const cls = node.attrs.find((a) => a.name === "class")?.value;
      if (cls && /^align-(left|center|right)$/.test(cls)) attrs.push(`class="${cls}"`);
    }
    return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>${["br", "hr"].includes(tag) ? "" : children + `</${tag}>`}`;
  };
  return htmlNodes(html).map(clean).join("");
}
export function plainText(html: string): string {
  const visit = (node: HtmlNode): string =>
    node.nodeName === "#text"
      ? (node as DefaultTreeAdapterMap["textNode"]).value
      : "childNodes" in node
        ? node.childNodes.map(visit).join(" ")
        : "";
  return htmlNodes(html).map(visit).join(" ").trim();
}
