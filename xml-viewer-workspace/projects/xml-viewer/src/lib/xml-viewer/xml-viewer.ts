// xml-viewer.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'xml-viewer',
  standalone: true,
  templateUrl: './xml-viewer.html',
  styleUrl: './xml-viewer.css'
})
export class XmlViewer implements OnInit {
  @Input() xml!: string;

  highlightedXml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (!this.xml?.trim()) {
      this.highlightedXml = this.sanitizer.bypassSecurityTrustHtml(
        '<span class="comment">&lt;!-- No XML content --&gt;</span>'
      );
      return;
    }

    const formatted = this.formatAndHighlight(this.xml);
    this.highlightedXml = this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private formatAndHighlight(xml: string): string {
    // Basic XML beautifier + syntax highlighting
    let formatted = '';
    let indentLevel = 0;
    const indent = '  ';

    // Remove extra whitespace between tags
    xml = xml.trim().replace(/>\s*</g, '><');

    let i = 0;
    while (i < xml.length) {
      const char = xml[i];

      // Comment
      if (xml.substr(i, 4) === '<!--') {
        formatted += '<span class="comment">';
        while (i < xml.length && xml.substr(i, 3) !== '-->') {
          formatted += this.escapeHtml(xml[i]);
          i++;
        }
        if (xml.substr(i, 3) === '-->') {
          formatted += '--&gt;</span>';
          i += 3;
        }
        continue;
      }

      // CDATA
      if (xml.substr(i, 9) === '<![CDATA[') {
        formatted += '<span class="cdata">&lt;![CDATA[';
        i += 9;
        while (i < xml.length && xml.substr(i, 3) !== ']]>') {
          formatted += this.escapeHtml(xml[i]);
          i++;
        }
        if (xml.substr(i, 3) === ']]>') {
          formatted += ']]&gt;</span>';
          i += 3;
        }
        continue;
      }

      // Processing instruction <? ... ?>
      if (char === '<' && xml[i + 1] === '?') {
        formatted += '<span class="pi">&lt;?';
        i += 2;
        while (i < xml.length && !(xml[i] === '?' && xml[i + 1] === '>')) {
          formatted += this.escapeHtml(xml[i]);
          i++;
        }
        if (xml[i] === '?' && xml[i + 1] === '>') {
          formatted += '?&gt;</span>';
          i += 2;
        }
        continue;
      }

      // Opening/closing tag
      if (char === '<') {
        formatted += '<span class="tag">&lt;';

        // Closing tag </
        if (xml[i + 1] === '/') {
          indentLevel = Math.max(0, indentLevel - 1);
          formatted += '/';
          i++;
        }

        i++;
        // Tag name
        while (i < xml.length && !' />'.includes(xml[i])) {
          formatted += this.escapeHtml(xml[i]);
          i++;
        }

        // Attributes
        while (i < xml.length && xml[i] !== '>' && xml[i] !== '/') {
          if (xml[i] === ' ') {
            formatted += ' ';
            i++;
            continue;
          }

          // attr name
          formatted += '<span class="attr">';
          while (i < xml.length && xml[i] !== '=' && xml[i] !== ' ' && xml[i] !== '>' && xml[i] !== '/') {
            formatted += this.escapeHtml(xml[i]);
            i++;
          }
          formatted += '</span>';

          if (xml[i] === '=') {
            formatted += '=';
            i++;

            if (xml[i] === '"' || xml[i] === "'") {
              const quote = xml[i];
              formatted += quote + '<span class="value">';
              i++;

              while (i < xml.length && xml[i] !== quote) {
                formatted += this.escapeHtml(xml[i]);
                i++;
              }
              if (xml[i] === quote) {
                formatted += '</span>' + quote;
                i++;
              }
            }
          }
        }

        // Self-closing />
        if (xml[i] === '/') {
          formatted += '/';
          i++;
        }

        if (xml[i] === '>') {
          formatted += '&gt;</span>';
          i++;

          // Increase indent only for opening tags (not self-closing or closing)
          if (xml[i - 2] !== '/' && xml[i - 1] !== '/') {
            indentLevel++;
          }

          formatted += '\n' + indent.repeat(indentLevel);
        }
        continue;
      }

      // Text content
      formatted += this.escapeHtml(char);
      i++;
    }

    return formatted.trim();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}