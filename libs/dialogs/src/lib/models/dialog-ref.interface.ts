import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef } from '@angular/core';
import { SdwDialogConfig } from './config.interface';

export interface DialogRef<TData> {
  unique_key: string;
  componentRef: ComponentRef<DialogRef<unknown>>;
  parentRef: any;
  data: TData;
  overlayRef: OverlayRef;
  config: SdwDialogConfig;
}

export interface DockedDialogRef<TData = unknown> {
  key: number;
  position: number;
  dialogRef: DialogRef<TData>;
}
