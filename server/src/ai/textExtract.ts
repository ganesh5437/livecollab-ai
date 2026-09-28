import * as Y from "yjs";

export function extractPlainText(ydoc: Y.Doc): string {
  const fragment = ydoc.getXmlFragment("default");
  const lines: string[] = [];

  fragment.forEach((node) => {
    lines.push(walkNode(node));
  });

  return lines.filter(Boolean).join("\n").trim();
}

function walkNode(node: Y.XmlElement | Y.XmlText | Y.XmlHook): string {
  if (node instanceof Y.XmlText) {
    return node.toString();
  }
  if (node instanceof Y.XmlElement) {
    const parts: string[] = [];
    node.toArray().forEach((child) => parts.push(walkNode(child as any)));
    return parts.join("");
  }
  return "";
}

export function chunkText(text: string, targetChars = 800): string[] {
  if (!text) return [];

  const paragraphs = text.split(/\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n" + para).length > targetChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}
