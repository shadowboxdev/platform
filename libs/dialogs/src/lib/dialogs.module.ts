import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { DialogModule as CdkDialogModule } from '@angular/cdk/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AngularSplitModule } from 'angular-split';

import { DialogBarComponent } from './components/dialog-bar.component';
import { DialogComponent } from './components/dialog.component';
import { SdwDialogContainer } from './components/dialog-container.component';
import {
  SDW_DIALOG_SCROLL_STRATEGY_PROVIDER,
  SdwDialog,
} from './services/dialog';
import { ResizeBase } from './behaviors/resize.base';

@NgModule({
  imports: [
    CommonModule,
    CdkDialogModule,
    OverlayModule,
    PortalModule,
    DragDropModule,

    MatButtonModule,
    MatIconModule,

    AngularSplitModule,
  ],
  declarations: [
    ResizeBase,
    DialogBarComponent,
    DialogComponent,
    SdwDialogContainer,
  ],
  exports: [DialogBarComponent, DialogComponent],
  providers: [SdwDialog, SDW_DIALOG_SCROLL_STRATEGY_PROVIDER],
})
export class DialogsModule {}
