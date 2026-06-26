// xml-viewer.component.ts
import { Component, Input, signal, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('xmlViewerContainer') xmlViewerContainer!: ElementRef<HTMLDivElement>;

  @Input() set xml(value: string | undefined) {
    if (!value?.trim()) {
      this.root.set(null);
      return;
    }

    const parsed = parseXml(value);
    this.root.set(parsed);
  }

  root = signal<XmlNode | null>(null);
  showScrollToTop = signal<boolean>(false);

  expandAll() {
    this.traverseAndSet(this.root(), true);
  }

  collapseAll() {
    this.traverseAndSet(this.root(), false);
  }

  scrollToTop() {
    if (this.xmlViewerContainer) {
      this.xmlViewerContainer.nativeElement.scrollTop = 0;
    }
  }

  onContainerScroll(event: Event) {
    const element = event.target as HTMLDivElement;
    // Show scroll-to-top button if scrolled down more than 300px
    this.showScrollToTop.set(element.scrollTop > 300);
  }

  private traverseAndSet(node: XmlNode | null, expanded: boolean) {
    if (!node) return;
    if (node.type === 'element') {
      node.expanded = expanded;
      node.children?.forEach(child => this.traverseAndSet(child, expanded));
    }
  }
}
