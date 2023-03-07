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
  declarations: [DialogBarComponent, DialogComponent],
  exports: [DialogBarComponent, DialogComponent],
})
export class DialogsModule {}
