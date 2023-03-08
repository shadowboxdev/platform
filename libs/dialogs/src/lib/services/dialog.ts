import { ComponentType, Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import {
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  OnDestroy,
  Optional,
  SkipSelf,
  TemplateRef,
  Type,
} from '@angular/core';

import { defer, Observable, Subject } from 'rxjs';
import { Dialog, DialogConfig } from '@angular/cdk/dialog';
import { startWith } from 'rxjs/operators';
import { MatDialogConfig } from '@angular/material/dialog';
import {
  SdwDialogContainer,
  _SdwDialogContainerBase,
} from '../components/dialog-container.component';
import { SdwDialogRef } from '../dialog-ref.class';

/** Injection token that can be used to access the data that was passed in to a dialog. */
export const MAT_DIALOG_DATA = new InjectionToken<unknown>('MatMdcDialogData');

/** Injection token that can be used to specify default dialog options. */
export const MAT_DIALOG_DEFAULT_OPTIONS = new InjectionToken<MatDialogConfig>(
  'mat-mdc-dialog-default-options'
);

/** Injection token that determines the scroll handling while the dialog is open. */
export const SDW_DIALOG_SCROLL_STRATEGY = new InjectionToken<
  () => ScrollStrategy
>('sdw-dialog-scroll-strategy');

/** @docs-private */
export function SDW_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(
  overlay: Overlay
): () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

/** @docs-private */
export const SDW_DIALOG_SCROLL_STRATEGY_PROVIDER = {
  provide: SDW_DIALOG_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: SDW_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY,
};

/** @docs-private */
export function MAT_DIALOG_SCROLL_STRATEGY_FACTORY(
  overlay: Overlay
): () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

// Counter for unique dialog ids.
let uniqueId = 0;

/**
 * Base class for dialog services. The base dialog service allows
 * for arbitrary dialog refs and dialog container components.
 */
@Injectable()
export abstract class _SdwDialogBase<C extends _SdwDialogContainerBase>
  implements OnDestroy
{
  private readonly _openDialogsAtThisLevel: SdwDialogRef<any>[] = [];
  private readonly _afterAllClosedAtThisLevel = new Subject<void>();
  private readonly _afterOpenedAtThisLevel = new Subject<SdwDialogRef<any>>();
  private _scrollStrategy: () => ScrollStrategy;
  protected _idPrefix = 'mat-dialog-';
  private _dialog: Dialog;
  protected dialogConfigClass = MatDialogConfig;

  /** Keeps track of the currently-open dialogs. */
  get openDialogs(): SdwDialogRef<any>[] {
    return this._parentDialog
      ? this._parentDialog.openDialogs
      : this._openDialogsAtThisLevel;
  }

  /** Stream that emits when a dialog has been opened. */
  get afterOpened(): Subject<SdwDialogRef<any>> {
    return this._parentDialog
      ? this._parentDialog.afterOpened
      : this._afterOpenedAtThisLevel;
  }

  private _getAfterAllClosed(): Subject<void> {
    const parent = this._parentDialog;
    return parent
      ? parent._getAfterAllClosed()
      : this._afterAllClosedAtThisLevel;
  }

  /**
   * Stream that emits when all open dialog have finished closing.
   * Will emit on subscribe if there are no open dialogs to begin with.
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  readonly afterAllClosed: Observable<void> = defer(() =>
    this.openDialogs.length
      ? this._getAfterAllClosed()
      : this._getAfterAllClosed().pipe(startWith(undefined))
  ) as Observable<any>;

  constructor(
    private _overlay: Overlay,
    injector: Injector,
    private _defaultOptions: MatDialogConfig | undefined,
    private _parentDialog: _SdwDialogBase<C> | undefined,
    scrollStrategy: any,
    private _dialogRefConstructor: Type<SdwDialogRef<any>>,
    private _dialogContainerType: Type<C>,
    private _dialogDataToken: InjectionToken<any>
  ) {
    this._scrollStrategy = scrollStrategy;
    this._dialog = injector.get(Dialog);
  }

  /**
   * Opens a modal dialog containing the given component.
   * @param component Type of the component to load into the dialog.
   * @param config Extra configuration options.
   * @returns Reference to the newly-opened dialog.
   */
  open<T, D = any, R = any>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>
  ): SdwDialogRef<T, R>;

  /**
   * Opens a modal dialog containing the given template.
   * @param template TemplateRef to instantiate as the dialog content.
   * @param config Extra configuration options.
   * @returns Reference to the newly-opened dialog.
   */
  open<T, D = any, R = any>(
    template: TemplateRef<T>,
    config?: MatDialogConfig<D>
  ): SdwDialogRef<T, R>;

  open<T, D = any, R = any>(
    template: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<D>
  ): SdwDialogRef<T, R>;

  open<T, D = any, R = any>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<D>
  ): SdwDialogRef<T, R> {
    let dialogRef: SdwDialogRef<T, R>;
    config = { ...(this._defaultOptions || new MatDialogConfig()), ...config };
    config.id = config.id || `${this._idPrefix}${uniqueId++}`;
    config.scrollStrategy = config.scrollStrategy || this._scrollStrategy();

    const cdkRef = this._dialog.open<R, D, T>(componentOrTemplateRef, {
      ...config,
      maxWidth: '100vw',
      positionStrategy: this._overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      // Disable closing since we need to sync it up to the animation ourselves.
      disableClose: true,
      // Disable closing on destroy, because this service cleans up its open dialogs as well.
      // We want to do the cleanup here, rather than the CDK service, because the CDK destroys
      // the dialogs immediately whereas we want it to wait for the animations to finish.
      closeOnDestroy: false,
      // Disable closing on detachments so that we can sync up the animation.
      // The Material dialog ref handles this manually.
      closeOnOverlayDetachments: false,
      hasBackdrop: false,
      container: {
        type: this._dialogContainerType,
        providers: () => [
          // Provide our config as the CDK config as well since it has the same interface as the
          // CDK one, but it contains the actual values passed in by the user for things like
          // `disableClose` which we disable for the CDK dialog since we handle it ourselves.
          { provide: this.dialogConfigClass, useValue: config },
          { provide: DialogConfig, useValue: config },
        ],
      },
      templateContext: () => ({ dialogRef }),
      providers: (ref, cdkConfig, dialogContainer) => {
        dialogRef = new this._dialogRefConstructor(
          ref,
          config,
          dialogContainer
        );
        dialogRef.updatePosition(config?.position);

        return [
          { provide: this._dialogContainerType, useValue: dialogContainer },
          { provide: this._dialogDataToken, useValue: cdkConfig.data },
          { provide: this._dialogRefConstructor, useValue: dialogRef },
        ];
      },
    });

    // This can't be assigned in the `providers` callback, because
    // the instance hasn't been assigned to the CDK ref yet.
    dialogRef!.componentInstance = cdkRef.componentInstance!;

    this.openDialogs.push(dialogRef!);
    this.afterOpened.next(dialogRef!);

    dialogRef!.afterClosed().subscribe(() => {
      const index = this.openDialogs.indexOf(dialogRef);

      if (index > -1) {
        this.openDialogs.splice(index, 1);

        if (!this.openDialogs.length) {
          this._getAfterAllClosed().next();
        }
      }
    });

    return dialogRef!;
  }

  /**
   * Closes all of the currently-open dialogs.
   */
  closeAll(): void {
    this._closeDialogs(this.openDialogs);
  }

  /**
   * Finds an open dialog by its id.
   * @param id ID to use when looking up the dialog.
   */
  getDialogById(id: string): SdwDialogRef<any> | undefined {
    return this.openDialogs.find((dialog) => dialog.id === id);
  }

  ngOnDestroy() {
    // Only close the dialogs at this level on destroy
    // since the parent service may still be active.
    this._closeDialogs(this._openDialogsAtThisLevel);
    this._afterAllClosedAtThisLevel.complete();
    this._afterOpenedAtThisLevel.complete();
  }

  private _closeDialogs(dialogs: SdwDialogRef<any>[]) {
    let i = dialogs.length;

    while (i--) {
      dialogs[i].close();
    }
  }
}

/**
 * Service to open Material Design modal dialogs.
 */
@Injectable()
export class SdwDialog extends _SdwDialogBase<SdwDialogContainer> {
  constructor(
    overlay: Overlay,
    injector: Injector,
    @Optional()
    @Inject(MAT_DIALOG_DEFAULT_OPTIONS)
    defaultOptions: MatDialogConfig,
    @Inject(SDW_DIALOG_SCROLL_STRATEGY) scrollStrategy: any,
    @Optional() @SkipSelf() parentDialog: SdwDialog
  ) {
    super(
      overlay,
      injector,
      defaultOptions,
      parentDialog,
      scrollStrategy,
      SdwDialogRef,
      SdwDialogContainer,
      MAT_DIALOG_DATA
    );

    this._idPrefix = 'sdw-dialog-';
  }
}
