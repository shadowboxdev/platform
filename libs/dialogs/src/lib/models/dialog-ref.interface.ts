import { Point } from '@angular/cdk/drag-drop';
import { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { SdwDialogConfig } from './config.interface';

export interface DialogRef<TData> {
  unique_key: string;
  componentPortal: ComponentPortal<unknown>;
  parentRef: any;
  data: TData;
  overlayRef: OverlayRef;
  config: SdwDialogConfig;
  docked: boolean;
  positionStrategy: GlobalPositionStrategy;
  position?: Point;
}

export interface DockedDialogRef<TData = unknown> {
  key: string;
  position: number;
  dialogRef: DialogRef<TData>;
}
