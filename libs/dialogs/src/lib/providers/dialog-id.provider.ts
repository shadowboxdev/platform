import { InjectionToken } from '@angular/core';
import { DialogRef } from '../models';

export const DIALOG_ID = new InjectionToken<string>('sdw.dialogs.dialogId');

export const SDW_DIALOG_REF = new InjectionToken<DialogRef<unknown>>(
  'sdw.dialogs.dialogRef'
);
