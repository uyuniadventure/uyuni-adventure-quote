/**
 * Declaración de tipos para el import Deno `npm:parse5@7.3.0` usado en
 * supabase/functions/_shared/proposal-html.ts (compartido con el frontend).
 * En el bundle del navegador el módulo real lo resuelve Vite; esto solo
 * satisface al typecheck de TypeScript.
 */
declare module "npm:parse5@7.3.0" {
  export interface Attribute {
    name: string;
    value: string;
  }
  export interface ChildNode {
    nodeName: string;
    tagName?: string;
    value?: string;
    attrs: Attribute[];
    childNodes: ChildNode[];
  }
  export interface TextNode {
    nodeName: "#text";
    value: string;
  }
  export interface DefaultTreeAdapterMap {
    childNode: ChildNode;
    textNode: TextNode;
  }
  export interface DocumentFragment {
    childNodes: ChildNode[];
  }
  export function parseFragment(html: string): DocumentFragment;
}
