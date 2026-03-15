import { create } from "xmlbuilder2";

export function buildXml(rootName: string, payload: Record<string, unknown>): string {
  const doc = create({ version: "1.0", encoding: "UTF-8" }).ele(rootName);
  appendNode(doc, payload);
  return doc.end({ prettyPrint: true });
}

function appendNode(node: any, payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      const listNode = node.ele(key);
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          const itemNode = listNode.ele("item");
          appendNode(itemNode, item as Record<string, unknown>);
        } else {
          listNode.ele("item").txt(String(item));
        }
      }
      continue;
    }

    if (typeof value === "object" && value !== null) {
      const child = node.ele(key);
      appendNode(child, value as Record<string, unknown>);
      continue;
    }

    node.ele(key).txt(String(value));
  }
}
