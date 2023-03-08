import { FocusOrigin } from '@angular/cdk/a11y';
import { merge, Observable, Subject } from 'rxjs';
import { DialogRef } from '@angular/cdk/dialog';

import {
  DialogPosition,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';

import { _SdwDialogContainerBase } from './components/dialog-container.component';
import { filter, take } from 'rxjs/operators';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { GlobalPositionStrategy } from '@angular/cdk/overlay';

export const enum SdwDialogState {
  OPEN,
  CLOSING,
  CLOSED,
}

/**
 * Reference to a dialog opened via the MatDialog service.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SdwDialogRef<T, R = any> extends MatDialogRef<T, R> {
  lastPosition: DialogPosition | null = null;

  savePosition(position: DialogPosition | undefined) {
    this.lastPosition = position ?? null;
  }
}
