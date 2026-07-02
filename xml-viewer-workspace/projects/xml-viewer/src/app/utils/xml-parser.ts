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
  NEWT: number;
  CANC: number;
  AMND: number;
  NOTX: number;
}

// Default node names to auto-expand
const DEFAULT_EXPAND_NODES = [
  'EBASSMessage',
  'AppHdr',
  'Document',
  'MnyMktUscrdMktSttstclRpt',
  'UscrdMktRpt'
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
    const shouldExpand = DEFAULT_EXPAND_NODES.includes(el.tagName);
    
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
 * Count transactions (Tx elements) and their types
 * Looks for <Tx> elements and extracts type from children like <TxTp> or first transaction type child
 */
export function countTransactions(xmlStr: string): TransactionStats {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');

  const stats: TransactionStats = {
    total: 0,
    NEWT: 0,
    CANC: 0,
    AMND: 0,
    NOTX: 0
  };

  // Get all Tx elements
  const txElements = doc.getElementsByTagName('Tx');
  
  if (txElements.length === 0) {
    // Check if this is a NOTX file (no transactions)
    stats.NOTX = 1;
    return stats;
  }

  stats.total = txElements.length;

  // For each Tx element, find the transaction type indicator
  Array.from(txElements).forEach((txEl) => {
    let txType: string | null = null;

    // Look for RptdTxSts (Transaction Type) or similar indicator elements
    const txTypeEl = txEl.querySelector('RptdTxSts');
    if (txTypeEl) {
      txType = txTypeEl.textContent?.trim() || null;
    }

    // If RptdTxSts not found, look for other common type indicators in children
    if (!txType) {
      const children = Array.from(txEl.children);
      for (const child of children) {
        const text = child.textContent?.trim();
        if (text && ['NEWT', 'CANC', 'AMND', 'NOTX'].includes(text)) {
          txType = text;
          break;
        }
      }
    }

    // Count the transaction type
    if (txType === 'NEWT') stats.NEWT++;
    else if (txType === 'CANC') stats.CANC++;
    else if (txType === 'AMND') stats.AMND++;
    else if (txType === 'NOTX') stats.NOTX++;
  });

  return stats;
}

// Helper to expose default expansion rule so UI can reset to parser defaults
export function isDefaultExpanded(tagName?: string): boolean {
  if (!tagName) return false;
  return DEFAULT_EXPAND_NODES.includes(tagName);
}
