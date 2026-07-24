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

export interface TransactionStats {
  total: number;
  ACPT: number;
  RJCT: number;
  ACTC: number;
  PART: number;
}

// Default node names to auto-expand
const DEFAULT_EXPAND_NODES = [
  'EBASSMessage',
  'AppHdr',
  'Document',
  'MnyMktUscrdMktSttstclRpt',
  'UscrdMktRpt'
];

// Node names to collapse by default
const DEFAULT_COLLAPSE_NODES = [
  'stsbah:Fr',
  'stsbah:To',
  'txresp:RptgPrd',
  'txresp:VldtnRule'
];

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
    
    // Check if node should be expanded based on tag name
    const shouldExpand = DEFAULT_EXPAND_NODES.includes(el.tagName) && 
                        !DEFAULT_COLLAPSE_NODES.includes(el.tagName);
    
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

/**
 * Count transactions (Tx elements) and their status types
 * Looks for <txresp:Sts> elements and counts ACPT, RJCT, ACTC, PART statuses
 */
export function countTransactions(xmlStr: string): TransactionStats {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');

  const stats: TransactionStats = {
    total: 0,
    ACPT: 0,
    RJCT: 0,
    ACTC: 0,
    PART: 0
  };

  // Get all txresp:Sts elements
  const stsElements = doc.getElementsByTagName('txresp:Sts');
  
  if (stsElements.length === 0) {
    return stats;
  }

  stats.total = stsElements.length;

  // Count each status type
  Array.from(stsElements).forEach((stsEl) => {
    const status = stsEl.textContent?.trim() || '';

    switch (status) {
      case 'ACPT':
        stats.ACPT++;
        break;
      case 'RJCT':
        stats.RJCT++;
        break;
      case 'ACTC':
        stats.ACTC++;
        break;
      case 'PART':
        stats.PART++;
        break;
    }
  });

  return stats;
}

// Helper to expose default expansion rule so UI can reset to parser defaults
export function isDefaultExpanded(tagName?: string): boolean {
  if (!tagName) return false;
  return DEFAULT_EXPAND_NODES.includes(tagName) && 
         !DEFAULT_COLLAPSE_NODES.includes(tagName);
}
