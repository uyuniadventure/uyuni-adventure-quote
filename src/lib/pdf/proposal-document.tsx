import { Document, Page, View, Text, Link, Image } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import {
  htmlNodes,
  type HtmlNode,
  safeLink,
} from "../../../supabase/functions/_shared/proposal-html";

/** The same restricted document HTML becomes PDF nodes; no browser/CSS rendering engine. */
export function htmlToPdfNodes(html: string): ReactNode[] {
  const blocks = new Set(["p", "h2", "h3", "ul", "ol", "table", "hr", "img"]);
  const flow = (nodes: HtmlNode[], key: string): ReactNode[] => {
    const result: ReactNode[] = [];
    let inline: ReactNode[] = [];
    const flush = () => {
      if (inline.length) {
        result.push(<Text key={`${key}-text-${result.length}`}>{inline}</Text>);
        inline = [];
      }
    };
    nodes.forEach((node, i) => {
      if ("tagName" in node && blocks.has(node.tagName)) {
        flush();
        result.push(render(node, `${key}-${i}`));
      } else {
        const item = render(node, `${key}-${i}`, true);
        if (typeof item !== "string" || item.trim() || inline.length) inline.push(item);
      }
    });
    flush();
    return result;
  };
  const render = (node: HtmlNode, key: string, inline = false, marker = "•"): ReactNode => {
    if (node.nodeName === "#text") return "value" in node ? node.value : null;
    if (!("tagName" in node)) return null;
    const tag = node.tagName;
    if (tag === "img") {
      const src = node.attrs.find((a) => a.name === "src")?.value;
      return src && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src) ? (
        <Image
          key={key}
          src={src}
          style={{ maxHeight: 220, objectFit: "contain", marginVertical: 8 }}
        />
      ) : null;
    }
    const alignment = node.attrs.find((a) => a.name === "class")?.value.replace("align-", "");
    const textAlign = alignment === "center" || alignment === "right" ? alignment : "left";
    const children = node.childNodes.map((c, i) =>
      render(
        c,
        `${key}-${i}`,
        ["p", "h2", "h3", "strong", "em", "u", "a", "td", "th"].includes(tag),
      ),
    );
    if (tag === "br") return "\n";
    if (tag === "hr") return <View key={key} style={{ borderBottomWidth: 1, marginVertical: 8 }} />;
    if (tag === "a") {
      const href = safeLink(node.attrs.find((a) => a.name === "href")?.value ?? "");
      return href ? (
        <Link key={key} src={href}>
          {children}
        </Link>
      ) : (
        <Text key={key}>{children}</Text>
      );
    }
    if (["strong", "em", "u"].includes(tag))
      return (
        <Text
          key={key}
          style={{
            ...(tag === "strong" ? { fontWeight: 700 } : {}),
            ...(tag === "em" ? { fontStyle: "italic" } : {}),
            ...(tag === "u" ? { textDecoration: "underline" } : {}),
          }}
        >
          {children}
        </Text>
      );
    if (tag === "p" && node.childNodes.some((c) => "tagName" in c && c.tagName === "img"))
      return <View key={key}>{children}</View>;
    if (["h2", "h3", "p"].includes(tag))
      return (
        <Text
          key={key}
          style={{
            textAlign,
            fontSize: tag === "h2" ? 16 : tag === "h3" ? 12 : 10,
            fontWeight: tag === "p" ? 400 : 700,
            marginTop: tag === "h2" ? 12 : 4,
            marginBottom: 4,
          }}
        >
          {children}
        </Text>
      );
    if (tag === "td" || tag === "th")
      return (
        <View
          key={key}
          style={{
            flexGrow: 1,
            flexBasis: 0,
            padding: 4,
            borderBottomWidth: 0.5,
            textAlign,
            fontWeight: tag === "th" ? 700 : 400,
          }}
        >
          {flow(node.childNodes, key)}
        </View>
      );
    if (tag === "tr")
      return (
        <View key={key} style={{ flexDirection: "row" }} wrap={false}>
          {children}
        </View>
      );
    if (tag === "li")
      return (
        <View key={key} style={{ flexDirection: "row", marginVertical: 2 }}>
          <Text style={{ width: 18 }}>{marker}</Text>
          <View style={{ flex: 1 }}>{flow(node.childNodes, key)}</View>
        </View>
      );
    if (tag === "ul" || tag === "ol")
      return (
        <View key={key} style={{ marginVertical: 3 }}>
          {node.childNodes
            .filter((c) => "tagName" in c && c.tagName === "li")
            .map((c, i) => render(c, `${key}-${i}`, false, tag === "ol" ? `${i + 1}.` : "•"))}
        </View>
      );
    if (["table", "tbody"].includes(tag))
      return (
        <View key={key} style={{ marginVertical: 3 }}>
          {children.filter((v) => typeof v !== "string" || v.trim())}
        </View>
      );
    return inline ? <Text key={key}>{children}</Text> : null;
  };
  return flow(htmlNodes(html), "root");
}
export function ProposalDocument({ html }: { html: string }) {
  return (
    <Document title="Uyuni Adventure">
      <Page
        size="A4"
        style={{ padding: 36, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4 }}
      >
        {htmlToPdfNodes(html)}
        <Text
          fixed
          style={{ position: "absolute", bottom: 18, left: 36, fontSize: 8 }}
          render={({ pageNumber, totalPages }) => `Uyuni Adventure · ${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
