// xml-viewer.component.ts
import { Component, Input, signal, ViewChild, ElementRef, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { parseXml, countTransactions, type XmlNode, type TransactionStats, isDefaultExpanded } from '../../app/utils/xml-parser' // adjust path
import { XmlNodeComponent } from '../xml-node.component/xml-node.component';


@Component({
  selector: 'xml-viewer',
  standalone: true,
  imports: [CommonModule, XmlNodeComponent],
  template: `
    <div [class.fullscreen]="isFullscreen()" class="xml-viewer-wrapper">
      <div class="xml-viewer" #xmlViewerContainer (scroll)="onContainerScroll($event)">
        <div class="controls" *ngIf="root()">
          <button (click)="expandAll()" title="Expand All">Expand All</button>
          <button (click)="collapseAll()" title="Collapse All">Collapse All</button>
          <button (click)="toggleFullscreen()" [title]="isFullscreen() ? 'Exit Fullscreen' : 'Fullscreen'" class="fullscreen-btn">
            {{ isFullscreen() ? '✕' : '⛶' }}
          </button>
          
          <!-- Transaction Counter Display -->
          <div class="transaction-summary" *ngIf="transactionStats()">
            <span *ngIf="transactionStats()!.total === 0 && transactionStats()!.NOTX > 0" class="summary-text">
              # Transactions: 0 (NOTX)
            </span>
            <span *ngIf="transactionStats()!.total > 0" class="summary-text">
              # Total Transactions: {{ transactionStats()!.total }}
              <span *ngIf="transactionStats()!.NEWT > 0"> | NEWT: {{ transactionStats()!.NEWT }}</span>
              <span *ngIf="transactionStats()!.CANC > 0"> | CANC: {{ transactionStats()!.CANC }}</span>
              <span *ngIf="transactionStats()!.AMND > 0"> | AMND: {{ transactionStats()!.AMND }}</span>
            </span>
          </div>
        </div>

        <div class="content" [style.max-height]="getContentMaxHeight()">
          <app-xml-node *ngIf="root(); let r" [node]="r"></app-xml-node>
          <div *ngIf="!root()" class="empty">
            <span class="comment">&lt;!-- No valid XML or parse error --&gt;</span>
          </div>
        </div>

        <!-- Scroll to Top Button -->
        <button 
          *ngIf="showScrollToTop()" 
          class="scroll-to-top-btn" 
          (click)="scrollToTop()"
          title="Scroll to top"
        >
          ⬆
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./xml-viewer.css'] 
})
export class XmlViewerComponent implements OnInit, OnDestroy {
  @ViewChild('xmlViewerContainer') xmlViewerContainer!: ElementRef<HTMLDivElement>;

  @Input() set xml(value: string | undefined) {
    if (!value?.trim()) {
      this.root.set(null);
      this.transactionStats.set(null);
      return;
    }

    const parsed = parseXml(value);
    this.root.set(parsed);

    // Count transactions from the XML
    const stats = countTransactions(value);
    this.transactionStats.set(stats);
  }

  root = signal<XmlNode | null>(null);
  showScrollToTop = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);
  transactionStats = signal<TransactionStats | null>(null);

  ngOnInit() {
    // Add keyboard listener for Escape key
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isFullscreen()) {
      this.exitFullscreen();
    }
  }

  toggleFullscreen() {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen() {
    this.isFullscreen.set(true);
    // Prevent body scroll when in fullscreen
    document.body.style.overflow = 'hidden';
  }

  private exitFullscreen() {
    this.isFullscreen.set(false);
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  getContentMaxHeight(): string {
    if (this.isFullscreen()) {
      // In fullscreen: 100vh minus toolbar height
      return 'calc(100vh - 80px)';
    } else {
      // Normal mode: 80vh minus toolbar height
      return 'calc(80vh - 80px)';
    }
  }

  expandAll() {
    this.traverseAndSet(this.root(), true);
  }

  // Reset expanded state to parser defaults rather than collapsing everything
  collapseAll() {
    this.resetToDefaults(this.root());
  }

  private resetToDefaults(node: XmlNode | null) {
    if (!node) return;
    if (node.type === 'element') {
      node.expanded = isDefaultExpanded(node.tagName);
      node.children?.forEach(child => this.resetToDefaults(child));
    }
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

  @HostListener('window:resize')
  onWindowResize() {
    // Trigger view update on resize to recalculate max-height
    this.xmlViewerContainer?.nativeElement.style.maxHeight;
  }
}
