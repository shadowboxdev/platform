/* eslint-disable @angular-eslint/no-output-on-prefix */
import {
  FocusMonitor,
  FocusTrapFactory,
  InteractivityChecker,
} from '@angular/cdk/a11y';
import { OverlayRef } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { CdkDialogContainer } from '@angular/cdk/dialog';
import {
  coerceCssPixelValue,
  coerceNumberProperty,
} from '@angular/cdk/coercion';
import { MatDialogConfig } from '@angular/material/dialog';
import {
  CdkDrag,
  CdkDragEnd,
  DragDrop,
  DragRef,
  Point,
} from '@angular/cdk/drag-drop';
import { SdwDialogRef } from '../dialog-ref.class';
import { SdwDialog } from '../services/dialog';
import { PopupService } from '../services/dialog.service';

/** Event that captures the state of dialog container animations. */
interface LegacyDialogAnimationEvent {
  state: 'opened' | 'opening' | 'closing' | 'closed';
  totalTime: number;
}

/** Class added when the dialog is open. */
const OPEN_CLASS = 'mdc-dialog--open';

/** Class added while the dialog is opening. */
const OPENING_CLASS = 'mdc-dialog--opening';

/** Class added while the dialog is closing. */
const CLOSING_CLASS = 'mdc-dialog--closing';

/** Duration of the opening animation in milliseconds. */
export const OPEN_ANIMATION_DURATION = 150;

/** Duration of the closing animation in milliseconds. */
export const CLOSE_ANIMATION_DURATION = 75;

/**
 * Base class for the `MatDialogContainer`. The base class does not implement
 * animations as these are left to implementers of the dialog container.
 */
// tslint:disable-next-line:validate-decorators
@Component({ template: '' })
export abstract class _SdwDialogContainerBase extends CdkDialogContainer<MatDialogConfig> {
  /** Emits when an animation state changes. */
  _animationStateChanged = new EventEmitter<LegacyDialogAnimationEvent>();

  currentZ = 0;
  currentInstance = 0;

  constructor(
    elementRef: ElementRef,
    focusTrapFactory: FocusTrapFactory,
    @Optional() @Inject(DOCUMENT) _document: any,
    dialogConfig: MatDialogConfig,
    interactivityChecker: InteractivityChecker,
    ngZone: NgZone,
    readonly overlayRef: OverlayRef,
    readonly popup: PopupService,
    focusMonitor?: FocusMonitor
  ) {
    super(
      elementRef,
      focusTrapFactory,
      _document,
      dialogConfig,
      interactivityChecker,
      ngZone,
      overlayRef,
      focusMonitor
    );
  }

  /** Starts the dialog exit animation. */
  abstract _startExitAnimation(): void;

  protected override _captureInitialFocus(): void {
    if (!this._config.delayFocusTrap) {
      this._trapFocus();
    }
  }

  /**
   * Callback for when the open dialog animation has finished. Intended to
   * be called by sub-classes that use different animation implementations.
   */
  protected _openAnimationDone(totalTime: number) {
    if (this._config.delayFocusTrap) {
      this._trapFocus();
    }

    this._animationStateChanged.next({ state: 'opened', totalTime });
  }
}

const TRANSITION_DURATION_PROPERTY = '--mat-dialog-transition-duration';

// TODO(mmalerba): Remove this function after animation durations are required
//  to be numbers.
/**
 * Converts a CSS time string to a number in ms. If the given time is already a
 * number, it is assumed to be in ms.
 */
function parseCssTime(time: string | number | undefined): number | null {
  if (time == null) {
    return null;
  }
  if (typeof time === 'number') {
    return time;
  }
  if (time.endsWith('ms')) {
    return coerceNumberProperty(time.substring(0, time.length - 2));
  }
  if (time.endsWith('s')) {
    return coerceNumberProperty(time.substring(0, time.length - 1)) * 1000;
  }
  if (time === '0') {
    return 0;
  }
  return null; // anything else is invalid.
}

/**
 * Internal component that wraps user-provided dialog content in a MDC dialog.
 * @docs-private
 */
@Component({
  selector: 'sdw-dialog-container',
  templateUrl: 'dialog-container.component.html',
  styleUrls: ['./dialog-container.component.scss'],
  //   encapsulation: ViewEncapsulation.None,
  // Disabled for consistency with the non-MDC dialog container.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'mat-mdc-dialog-container mdc-dialog',
    tabindex: '-1',
    '[attr.aria-modal]': '_config.ariaModal',
    '[id]': '_config.id',
    '[style.zIndex]': 'currentZ',
    '[attr.role]': '_config.role',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledBy',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
    '[class._mat-animation-noopable]': '!_animationsEnabled',
  },
  hostDirectives: [
    // {
    //   directive: CdkDrag,
    // },
  ],
})
export class SdwDialogContainer
  extends _SdwDialogContainerBase
  implements OnInit, OnDestroy
{
  /** Whether animations are enabled. */
  _animationsEnabled: boolean = this._animationMode !== 'NoopAnimations';

  /** Host element of the dialog container component. */
  private _hostElement: HTMLElement = this._elementRef.nativeElement;
  /** Duration of the dialog open animation. */
  private _openAnimationDuration = this._animationsEnabled
    ? parseCssTime(this._config.enterAnimationDuration) ??
      OPEN_ANIMATION_DURATION
    : 0;
  /** Duration of the dialog close animation. */
  private _closeAnimationDuration = this._animationsEnabled
    ? parseCssTime(this._config.exitAnimationDuration) ??
      CLOSE_ANIMATION_DURATION
    : 0;
  /** Current timer for dialog animations. */
  private _animationTimer: number | null = null;

  dragRef!: DragRef<any>;

  @ViewChild('titleBar', { static: true })
  titleBar!: ElementRef;

  constructor(
    elementRef: ElementRef,
    focusTrapFactory: FocusTrapFactory,
    @Optional() @Inject(DOCUMENT) document: any,
    dialogConfig: MatDialogConfig,
    checker: InteractivityChecker,
    ngZone: NgZone,
    overlayRef: OverlayRef,
    readonly dialog: SdwDialog,
    popup: PopupService,
    readonly dragDrop: DragDrop,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) private _animationMode?: string,
    focusMonitor?: FocusMonitor
  ) {
    super(
      elementRef,
      focusTrapFactory,
      document,
      dialogConfig,
      checker,
      ngZone,
      overlayRef,
      popup,
      focusMonitor
    );
  }

  protected override _contentAttached(): void {
    // Delegate to the original dialog-container initialization (i.e. saving the
    // previous element, setting up the focus trap and moving focus to the container).
    super._contentAttached();

    // Note: Usually we would be able to use the MDC dialog foundation here to handle
    // the dialog animation for us, but there are a few reasons why we just leverage
    // their styles and not use the runtime foundation code:
    //   1. Foundation does not allow us to disable animations.
    //   2. Foundation contains unnecessary features we don't need and aren't
    //      tree-shakeable. e.g. background scrim, keyboard event handlers for ESC button.
    //   3. Foundation uses unnecessary timers for animations to work around limitations
    //      in React's `setState` mechanism.
    //      https://github.com/material-components/material-components-web/pull/3682.
    this._startOpenAnimation();
  }

  ngOnInit() {
    this.currentInstance = this.popup.initModal();
    this.currentZ = this.popup.getInitialIndex(this.currentInstance);

    this.dragRef = this.dragDrop
      .createDrag(this.overlayRef.hostElement, {
        zIndex: this.currentZ,
        dragStartThreshold: 5,
        pointerDirectionChangeThreshold: 5,
      })
      .withHandles([this.titleBar]);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();

    if (this._animationTimer !== null) {
      clearTimeout(this._animationTimer);
    }
  }

  onDragBegin() {
    this.currentZ = this.popup.getNewIndex(this.currentInstance);

    this.dragRef['_config']['zIndex'] = this.currentZ;

    this.dragRef.enableHandle(this.titleBar.nativeElement);
    // console.log(this.overlayRef.hostElement);

    this.overlayRef.hostElement!.style.zIndex = this.currentZ.toString();

    this.dragRef.ended.subscribe((event) => this.onDragEnd(event));
  }

  onContentClick() {
    this.currentZ = this.popup.getNewIndex(this.currentInstance);
    this.dragRef['_config']['zIndex'] = this.currentZ;
    this.overlayRef.hostElement!.style.zIndex = this.currentZ.toString();
  }

  onDragEnd({
    source,
  }: {
    source: DragRef<any>;
    distance: Point;
    dropPoint: Point;
    event: MouseEvent | TouchEvent;
  }) {
    source.disableHandle(this.titleBar.nativeElement);
    // this.dragRef = null;
    const dialogRef = this.dialog.getDialogById(this._config.id!);
    if (!dialogRef) return;

    const position = source.getFreeDragPosition();

    // console.log(
    //   position,
    //   this._elementRef.nativeElement.getBoundingClientRect()
    // );

    const { left, top } =
      this._elementRef.nativeElement.getBoundingClientRect();

    // dialogRef.updatePosition({
    //   left: coerceCssPixelValue(left),
    //   top: coerceCssPixelValue(top),
    // });
  }

  resizeEnd(): void {
    const dialogRef = this.dialog.getDialogById(this._config.id!);

    const { width, height } =
      this._elementRef.nativeElement.getBoundingClientRect();

    dialogRef?.updateSize(
      coerceCssPixelValue(width),
      coerceCssPixelValue(height)
    );
  }

  /** Starts the dialog open animation if enabled. */
  private _startOpenAnimation() {
    this._animationStateChanged.emit({
      state: 'opening',
      totalTime: this._openAnimationDuration,
    });

    if (this._animationsEnabled) {
      // One would expect that the open class is added once the animation finished, but MDC
      // uses the open class in combination with the opening class to start the animation.
      this._hostElement.style.setProperty(
        TRANSITION_DURATION_PROPERTY,
        `${this._openAnimationDuration}ms`
      );
      this._hostElement.classList.add(OPENING_CLASS);
      this._hostElement.classList.add(OPEN_CLASS);
      this._waitForAnimationToComplete(
        this._openAnimationDuration,
        this._finishDialogOpen
      );
    } else {
      this._hostElement.classList.add(OPEN_CLASS);
      // Note: We could immediately finish the dialog opening here with noop animations,
      // but we defer until next tick so that consumers can subscribe to `afterOpened`.
      // Executing this immediately would mean that `afterOpened` emits synchronously
      // on `dialog.open` before the consumer had a change to subscribe to `afterOpened`.
      Promise.resolve().then(() => this._finishDialogOpen());
    }
  }

  /**
   * Starts the exit animation of the dialog if enabled. This method is
   * called by the dialog ref.
   */
  _startExitAnimation(): void {
    this._animationStateChanged.emit({
      state: 'closing',
      totalTime: this._closeAnimationDuration,
    });
    this._hostElement.classList.remove(OPEN_CLASS);

    if (this._animationsEnabled) {
      this._hostElement.style.setProperty(
        TRANSITION_DURATION_PROPERTY,
        `${this._openAnimationDuration}ms`
      );
      this._hostElement.classList.add(CLOSING_CLASS);
      this._waitForAnimationToComplete(
        this._closeAnimationDuration,
        this._finishDialogClose
      );
    } else {
      // This subscription to the `OverlayRef#backdropClick` observable in the `DialogRef` is
      // set up before any user can subscribe to the backdrop click. The subscription triggers
      // the dialog close and this method synchronously. If we'd synchronously emit the `CLOSED`
      // animation state event if animations are disabled, the overlay would be disposed
      // immediately and all other subscriptions to `DialogRef#backdropClick` would be silently
      // skipped. We work around this by waiting with the dialog close until the next tick when
      // all subscriptions have been fired as expected. This is not an ideal solution, but
      // there doesn't seem to be any other good way. Alternatives that have been considered:
      //   1. Deferring `DialogRef.close`. This could be a breaking change due to a new microtask.
      //      Also this issue is specific to the MDC implementation where the dialog could
      //      technically be closed synchronously. In the non-MDC one, Angular animations are used
      //      and closing always takes at least a tick.
      //   2. Ensuring that user subscriptions to `backdropClick`, `keydownEvents` in the dialog
      //      ref are first. This would solve the issue, but has the risk of memory leaks and also
      //      doesn't solve the case where consumers call `DialogRef.close` in their subscriptions.
      // Based on the fact that this is specific to the MDC-based implementation of the dialog
      // animations, the defer is applied here.
      Promise.resolve().then(() => this._finishDialogClose());
    }
  }

  /**
   * Completes the dialog open by clearing potential animation classes, trapping
   * focus and emitting an opened event.
   */
  private _finishDialogOpen = () => {
    this._clearAnimationClasses();
    this._openAnimationDone(this._openAnimationDuration);
  };

  /**
   * Completes the dialog close by clearing potential animation classes, restoring
   * focus and emitting a closed event.
   */
  private _finishDialogClose = () => {
    this._clearAnimationClasses();
    this._animationStateChanged.emit({
      state: 'closed',
      totalTime: this._closeAnimationDuration,
    });
  };

  /** Clears all dialog animation classes. */
  private _clearAnimationClasses() {
    this._hostElement.classList.remove(OPENING_CLASS);
    this._hostElement.classList.remove(CLOSING_CLASS);
  }

  private _waitForAnimationToComplete(duration: number, callback: () => void) {
    if (this._animationTimer !== null) {
      clearTimeout(this._animationTimer);
    }

    // Note that we want this timer to run inside the NgZone, because we want
    // the related events like `afterClosed` to be inside the zone as well.
    this._animationTimer = setTimeout(callback, duration);
  }
}
