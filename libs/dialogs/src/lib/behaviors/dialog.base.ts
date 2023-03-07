/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, inject, Type, Injector, ComponentRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DialogBarComponent } from '../components/dialog-bar.component';
import { DialogRef, DockedDialogRef, SdwDialogConfig } from '../models';
import { v4 as uuid } from 'uuid';
import { DIALOG_ID, SDW_DIALOG_REF } from '../providers/dialog-id.provider';

import { coerceCssPixelValue } from '@angular/cdk/coercion';

@Directive({})
export class DialogBase {
  private readonly _injector = inject(Injector);
  private readonly _overlay = inject(Overlay);

  componentsReferences = new Map<string, OverlayRef>();
  dockPosition: DockedDialogRef[] = [];
  minimizedDialogs$ = new BehaviorSubject<DockedDialogRef[]>([]);
  navigatorAdded = false;
  moveVal: number = 0;
  navigatorReferences: ComponentRef<unknown>[] = [];

  readonly getDockX = (index: number): string => {
    let dockedPos = 1;
    let leftPlacementValue = 0;
    for (let i = 0; i < this.dockPosition.length; i++) {
      if (this.dockPosition[i].key == index) {
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

    const child_unique_key = uuid();

    const positionStrategy = this._overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();

    const overlayRef = this._overlay.create({
      direction: 'ltr',
      hasBackdrop: false,
      disposeOnNavigation: false,
      positionStrategy,
    });

    // const dialogRef = {
    //   unique_key: child_unique_key,
    //   parentRef: this,
    //   data,
    //   overlayRef,
    //   config,
    // };

    // const injector = Injector.create(
    //   [
    //     {
    //       provide: DIALOG_ID,
    //       useValue: child_unique_key,
    //       multi: false,
    //     },
    //     {
    //       provide: SDW_DIALOG_REF,
    //       useValue: dialogRef,
    //       multi: false,
    //     },
    //   ],
    //   this._injector
    // );

    // const componentPortal = new ComponentPortal(
    //   componentRender,
    //   undefined,
    //   injector
    // );

    const componentPortal = new ComponentPortal(componentRender);

    const dialogRef = {
      unique_key: child_unique_key,
      parentRef: this,
      data,
      overlayRef,
      config,
      componentPortal,
    };

    const injector = Injector.create(
      [
        {
          provide: DIALOG_ID,
          useValue: child_unique_key,
          multi: false,
        },
        {
          provide: SDW_DIALOG_REF,
          useValue: dialogRef,
          multi: false,
        },
      ],
      this._injector
    );

    componentPortal.injector = injector;

    overlayRef.attach(componentPortal);

    this.componentsReferences.set(child_unique_key, overlayRef);
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

  dockComponent<TData>(index: number, dialogRef: DialogRef<TData>) {
    const len = this.dockPosition.length + 1;
    const docEle = { key: index, position: len, dialogRef };
    this.dockPosition.push(docEle);
    this.minimizedDialogs$.value.push(docEle);
    this.minimizedDialogs$.next(this.minimizedDialogs$.value);

    let leftPlacementValue = 0;

    if (this.dockPosition.length != 1) {
      leftPlacementValue =
        (this.dockPosition.length - 1) * 200 +
        (this.dockPosition.length - 1) * 2 +
        32;
    } else {
      leftPlacementValue = 32;
    }
    return leftPlacementValue;
  }

  undockComponent(key: any) {
    const newData: DockedDialogRef[] = [];
    let startChange = 0;

    for (let i = 0; i < this.dockPosition.length; i++) {
      if (this.dockPosition[i].key == key) {
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
  }

  moveDockerComponent(direction: any) {
    if (direction == 1) {
      if (this.moveVal != 0) this.moveVal = this.moveVal + 100;
    } else {
      this.moveVal = this.moveVal - 100;
    }
  }

  remove<TData = unknown>({ unique_key, overlayRef }: DialogRef<TData>) {
    if (!unique_key || !overlayRef) return;

    this.componentsReferences.delete(unique_key);
    overlayRef.detach();
  }
}
