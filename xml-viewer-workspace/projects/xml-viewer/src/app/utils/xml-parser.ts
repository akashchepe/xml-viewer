// src/lib/xml-parser.ts  (or inside the component file)
export interface XmlNode {
  type: 'element' | 'text' | 'comment' | 'cdata' | 'pi';
  tagName?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  content?: string;
  expanded?: boolean;   // we'll add this for collapsible
  depth?: number;       // track depth for expansion logic
}

export function parseXml(xmlStr: string): XmlNode | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    console.warn('XML Parse Error:', errorNode.textContent);
    return null;
  }

  function convert(node: Node, depth: number = 0): XmlNode | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      return text ? { type: 'text', content: text, depth } : null;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      return { type: 'comment', content: node.textContent || '', depth };
    }

    if (node.nodeType === Node.CDATA_SECTION_NODE) {
      return { type: 'cdata', content: node.textContent || '', depth };
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as Element;
    
    // Expand first two levels (depth 0 and 1), collapse the rest
    const shouldExpand = depth < 2;
    
    const n: XmlNode = {
      type: 'element',
      tagName: el.tagName,
      attributes: {},
      children: [],
      expanded: shouldExpand,
      depth,
    };

    // Attributes
    Array.from(el.attributes).forEach(attr => {
      n.attributes![attr.name] = attr.value;
    });

    // Children - filter out whitespace-only text nodes
    Array.from(el.childNodes).forEach(child => {
      const c = convert(child, depth + 1);
      if (c) n.children!.push(c);
    });

    return n;
  }

  const root = convert(doc.documentElement);
  return root;
}
