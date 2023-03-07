/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  GlobalPositionStrategy,
  Overlay,
  OverlayRef,
  PositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive,
  inject,
  Type,
  Injector,
  ComponentRef,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DialogBarComponent } from '../components/dialog-bar.component';
import { DialogRef, DockedDialogRef, SdwDialogConfig } from '../models';
import { v1, v4 as uuid } from 'uuid';
import { SDW_DIALOG_REF } from '../providers/dialog-id.provider';

import { coerceCssPixelValue } from '@angular/cdk/coercion';
import {
  always,
  applySpec,
  compose,
  concat,
  toString,
  constructN,
  F,
  identity,
  nthArg,
  filter,
  path,
  pathOr,
  propEq,
  map,
  append,
  remove,
  addIndex,
  assoc,
  flip,
} from 'ramda';
import { ensureArray, pathNotEq } from 'ramda-adjunct';
import { PopupService } from '../services/dialog.service';
import { Dialog } from '@angular/cdk/dialog';
import { Point } from '@angular/cdk/drag-drop';

type InjectorOptions = Parameters<typeof Injector.create>[0];

const mapIndexed = addIndex(map);
const createPortal = constructN(1, ComponentPortal);
const createDialogProviders = compose(
  ensureArray,
  applySpec({
    provide: always(SDW_DIALOG_REF),
    useValue: identity,
    multi: F,
  })
);

const getInjectorName = concat('__sdw_dialog_injector_');
const createInjectorOptions = applySpec<InjectorOptions>({
  name: compose<[unknown], unknown, string, string, string>(
    getInjectorName,
    toString,
    pathOr<string>('', ['unique_key']),
    nthArg(0)
  ),
  providers: compose(createDialogProviders, nthArg(0)),
  parent: nthArg(1),
});

const createInjector = compose(Injector.create, createInjectorOptions);
@Directive({})
export class DialogBase {
  private readonly _cdkDialog = inject(Dialog);
  private readonly _injector = inject(Injector);
  private readonly _overlay = inject(Overlay);
  readonly #popup = inject(PopupService);

  cachedViewContainers = new Map<string, ViewContainerRef>();
  componentsReferences = new Map<string, DialogRef<unknown>>();
  dockPosition: DockedDialogRef[] = [];
  minimizedDialogs$ = new BehaviorSubject<DockedDialogRef[]>([]);
  navigatorAdded = false;
  moveVal: number = 0;
  navigatorReferences: ComponentRef<unknown>[] = [];

  readonly getDockX = (key: string): string => {
    let dockedPos = 1;
    let leftPlacementValue = 0;
    for (let i = 0; i < this.dockPosition.length; i++) {
      if (this.dockPosition[i].key == key) {
        dockedPos = i + 1;
      }
    }

    if (dockedPos != 1) {
      leftPlacementValue = (dockedPos - 1) * 200 + (dockedPos - 1) * 2 + 32;
    } else {
      leftPlacementValue = 32;
    }

    return coerceCssPixelValue(leftPlacementValue + this.moveVal);
  };

  public open<D>(
    componentRender: Type<Partial<DialogRef<D>>>,
    data: D,
    config: SdwDialogConfig
  ): void {
    this.createComponent(componentRender, data, config);
  }

  createComponent<D>(
    componentRender: Type<Partial<DialogRef<D>>>,
    data: D,
    config: SdwDialogConfig
  ) {
    if (!this.navigatorAdded) this.createNavigator();

    let positionStrategy = this._overlay.position().global();

    if (config.position) {
      positionStrategy = this.updatePosition(positionStrategy, config.position);
    } else {
      positionStrategy = positionStrategy
        .centerHorizontally()
        .centerVertically();
    }

    const overlayRef = this._overlay.create({
      direction: 'ltr',
      hasBackdrop: false,
      disposeOnNavigation: false,
      positionStrategy,
    });

    const componentPortal = createPortal(componentRender);

    const dialogRef: DialogRef<D> = {
      unique_key: uuid(),
      parentRef: this,
      data,
      overlayRef,
      config,
      componentPortal,
      docked: false,
      positionStrategy,
      position: config.position,
    };

    const injector = createInjector(dialogRef, this._injector);

    dialogRef.componentPortal.injector = injector;

    overlayRef.attach(componentPortal);

    this.componentsReferences.set(dialogRef.unique_key, dialogRef);
  }

  updatePosition(
    strategy: GlobalPositionStrategy,
    position: Point
  ): GlobalPositionStrategy {
    if (!position) return strategy;

    if (position && position.x) {
      strategy = strategy.left(coerceCssPixelValue(position.x));
    } else {
      strategy = strategy.centerHorizontally();
    }

    if (position && position.y) {
      strategy = strategy.top(coerceCssPixelValue(position.y));
    } else {
      strategy = strategy.centerVertically();
    }

    return strategy;
  }

  createNavigator() {
    this.navigatorAdded = true;

    const overlayRef = this._overlay.create({
      direction: 'ltr',
      hasBackdrop: false,
      disposeOnNavigation: false,
      positionStrategy: this._overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
    });

    const componentPortal = new ComponentPortal(DialogBarComponent);
    const componentRef = overlayRef.attach(componentPortal);

    (componentRef.instance as any).unique_key = -1;
    (componentRef.instance as any).parentRef = this;
    this.navigatorReferences.push(componentRef);
  }

  updateDialogPosition(id: string, position: Point): void {
    const dialogRef = this.componentsReferences.get(id);

    if (!dialogRef) return;

    console.log(position);

    // const strategy = this.updatePosition(dialogRef.positionStrategy, position);

    // dialogRef.overlayRef.updatePositionStrategy(strategy);
    // dialogRef.overlayRef.updatePosition();

    this.componentsReferences.set(id, { ...dialogRef, position });
  }

  dockComponent<TData>(dockedPosition: number, dialogRef: DialogRef<TData>) {
    const len = this.dockPosition.length + 1;
    dialogRef = {
      ...dialogRef,
      docked: true,
    };
    const docEle = { key: dialogRef.unique_key, position: len, dialogRef };
    this.dockPosition = append(docEle, this.dockPosition);
    this.minimizedDialogs$.next(this.dockPosition);
    this.componentsReferences.set(dialogRef.unique_key, dialogRef);

    if (dialogRef.componentPortal.viewContainerRef) {
      this.cachedViewContainers.set(
        dialogRef.unique_key,
        dialogRef.componentPortal.viewContainerRef
      );
    }

    dialogRef.overlayRef.detach();
  }

  undockComponent(unique_key: string) {
    const newData: DockedDialogRef[] = [];

    let startChange = 0;

    const dialogRef = this.componentsReferences.get(unique_key);

    if (!dialogRef || !dialogRef.docked) return;

    for (let i = 0; i < this.dockPosition.length; i++) {
      if (this.dockPosition[i].key == unique_key) {
        startChange = 0;
      } else {
        if (startChange == 1) {
          const newPos = this.dockPosition[i].position - 1;
          newData.push({ ...this.dockPosition[i], position: newPos });
        } else {
          newData.push(this.dockPosition[i]);
        }
      }
    }

    this.dockPosition = newData;
    this.minimizedDialogs$.next(newData);

    const { overlayRef } = dialogRef;

    overlayRef.attach(dialogRef.componentPortal);

    if (!dialogRef.position) return;

    console.log(dialogRef.position);
    this.updatePosition(dialogRef.positionStrategy, dialogRef.position);
    this.componentsReferences.set(unique_key, {
      ...dialogRef,
      docked: false,
    });
  }

  close(unique_key: string): void {
    this.undockComponent(unique_key);
    const dialogRef = this.componentsReferences.get(unique_key);

    if (dialogRef) this.#remove(dialogRef);
  }

  moveDockerComponent(direction: 1 | -1) {
    if (direction == 1) {
      if (this.moveVal != 0) this.moveVal = this.moveVal + 100;
    } else {
      this.moveVal = this.moveVal - 100;
    }
  }

  #remove<TData = unknown>({ unique_key, overlayRef }: DialogRef<TData>) {
    if (!unique_key || !overlayRef) return;

    this.componentsReferences.delete(unique_key);
    overlayRef.detach();
  }
}
