// xml-viewer.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { parseXml, type XmlNode } from '../../app/utils/xml-parser' // adjust path
import { XmlNodeComponent } from '../xml-node.component/xml-node.component';


@Component({
  selector: 'xml-viewer',
  standalone: true,
  imports: [CommonModule, XmlNodeComponent],
  templateUrl: './xml-viewer.html',
  styleUrls: ['./xml-viewer.css'] 
})
export class XmlViewerComponent {
  @Input() set xml(value: string | undefined) {
    if (!value?.trim()) {
      this.root.set(null);
      return;
    }

    const parsed = parseXml(value);
    this.root.set(parsed);
  }

  root = signal<XmlNode | null>(null);

  expandAll() {
    this.traverseAndSet(this.root(), true);
  }

  collapseAll() {
    this.traverseAndSet(this.root(), false);
  }

  private traverseAndSet(node: XmlNode | null, expanded: boolean) {
    if (!node) return;
    if (node.type === 'element') {
      node.expanded = expanded;
      node.children?.forEach(child => this.traverseAndSet(child, expanded));
    }
  }
}