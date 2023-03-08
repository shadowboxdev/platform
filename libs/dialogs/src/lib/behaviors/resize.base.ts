import { coerceElement } from '@angular/cdk/coercion';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  ElementRef,
  NgZone,
  AfterViewInit,
  ViewChild,
  Directive,
  inject,
  Optional,
  ContentChild,
  Input,
  Output,
  EventEmitter,
  AfterContentInit,
} from '@angular/core';

@Directive({
  selector: '[sdwResizableDialog]',
  exportAs: 'sdwResizableDialog',
})
export class ResizeBase implements AfterContentInit {
  private readonly ngZone: NgZone = inject(NgZone);

  @Input()
  hostElement: ElementRef | HTMLElement | null = null;

  @Output()
  resizeStart = new EventEmitter<void>();

  @Output()
  resizeEnd = new EventEmitter<void>();

  @ContentChild('resizeBox')
  @ViewChild('resizeBox')
  resizeBox!: ElementRef;

  @ContentChild('dragHandleCorner')
  @ViewChild('dragHandleCorner')
  dragHandleCorner!: ElementRef;

  @ContentChild('dragHandleRight')
  @ViewChild('dragHandleRight')
  dragHandleRight!: ElementRef;

  @ContentChild('dragHandleBottom')
  @ViewChild('dragHandleBottom')
  dragHandleBottom!: ElementRef;

  resizeBoxElement!: HTMLElement;

  get dragHandleCornerElement(): HTMLElement {
    return this.dragHandleCorner.nativeElement;
  }

  get dragHandleRightElement(): HTMLElement {
    return this.dragHandleRight.nativeElement;
  }

  get dragHandleBottomElement(): HTMLElement {
    return this.dragHandleBottom.nativeElement;
  }

  constructor(@Optional() private readonly _elementRef?: ElementRef | null) {}

  ngAfterContentInit() {
    console.log(this.resizeBox);
    this.resizeBoxElement = coerceElement(this.resizeBox);
    this.setAllHandleTransform();
  }

  setAllHandleTransform() {
    const rect = this.resizeBoxElement.getBoundingClientRect();
    console.log(rect);

    this.setHandleTransform(this.dragHandleCornerElement, rect, 'both');
    this.setHandleTransform(this.dragHandleRightElement, rect, 'x');
    this.setHandleTransform(this.dragHandleBottomElement, rect, 'y');
  }

  setHandleTransform(
    dragHandle: HTMLElement,
    targetRect: ClientRect | DOMRect,
    position: 'x' | 'y' | 'both'
  ) {
    const dragRect = dragHandle.getBoundingClientRect();
    const translateX = targetRect.width - dragRect.width;
    const translateY = targetRect.height - dragRect.height;

    if (position === 'x') {
      dragHandle.style.transform = `translate(${translateX}px, 0)`;
    }

    if (position === 'y') {
      dragHandle.style.transform = `translate(0, ${translateY}px)`;
    }

    if (position === 'both') {
      dragHandle.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }
  }

  dragMove(dragHandle: HTMLElement, $event: CdkDragMove<any>) {
    this.ngZone.runOutsideAngular(() => {
      this.resize(dragHandle, this.resizeBoxElement);
      this.setAllHandleTransform();
    });
  }

  dragEnd() {
    this.resizeEnd.emit();
  }

  resize(dragHandle: HTMLElement, target: HTMLElement) {
    const dragRect = dragHandle.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const width = dragRect.left - targetRect.left + dragRect.width;
    const height = dragRect.top - targetRect.top + dragRect.height;

    target.style.width = width + 'px';
    target.style.height = height + 'px';
  }
}
