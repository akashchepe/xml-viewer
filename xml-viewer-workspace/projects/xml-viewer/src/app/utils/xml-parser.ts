// src/lib/xml-parser.ts  (or inside the component file)
export interface XmlNode {
  type: 'element' | 'text' | 'comment' | 'cdata' | 'pi';
  tagName?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  content?: string;
  expanded?: boolean;   // we'll add this for collapsible
}

export function parseXml(xmlStr: string): XmlNode | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    console.warn('XML Parse Error:', errorNode.textContent);
    return null;
  }

  function convert(node: Node): XmlNode | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      return text ? { type: 'text', content: text } : null;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      return { type: 'comment', content: node.textContent || '' };
    }

    if (node.nodeType === Node.CDATA_SECTION_NODE) {
      return { type: 'cdata', content: node.textContent || '' };
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as Element;
    const n: XmlNode = {
      type: 'element',
      tagName: el.tagName,
      attributes: {},
      children: [],
      expanded: true, // default expanded
    };

    // Attributes
    Array.from(el.attributes).forEach(attr => {
      n.attributes![attr.name] = attr.value;
    });

    // Children
    Array.from(el.childNodes).forEach(child => {
      const c = convert(child);
      if (c) n.children!.push(c);
    });

    return n;
  }

  const root = convert(doc.documentElement);
  return root;
}