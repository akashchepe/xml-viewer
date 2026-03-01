// xml-node.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { XmlNode } from '../../app/utils/xml-parser';  // adjust path

@Component({
  selector: 'app-xml-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xml-node.component.html',
  styleUrls: ['./xml-node.component.css']
})
export class XmlNodeComponent {
  @Input() node!: XmlNode;

  get hasChildren(): boolean {
    return !!this.node.children?.length;
  }

  get attrEntries() {
    return Object.entries(this.node.attributes || {});
  }

  toggle() {
    if (!this.hasChildren) return;
    this.node.expanded = !this.node.expanded;
  }
}