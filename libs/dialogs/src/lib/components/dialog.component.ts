/* eslint-disable @angular-eslint/no-host-metadata-property */
import { CdkDragEnd, Point } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectFlags,
  Input,
  OnInit,
} from '@angular/core';
import { SDW_DIALOG_REF } from '../providers/dialog-id.provider';
import { ResizeBase } from '../behaviors/resize.base';

import { DialogService, PopupService } from '../services/dialog.service';
import { coerceCssPixelValue } from '@angular/cdk/coercion';
import { replace } from 'ramda';
import { DOCUMENT } from '@angular/common';
import { DialogRef } from '../models';

@Component({
  selector: 'sdw-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
  exportAs: 'sdwDialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent<TData = unknown>
  extends ResizeBase
  implements OnInit
{
  @Input() headerColor = '#0072c6';
  @Input() titleColor = '#FFF';
  @Input() iconsColor = '#FFF';
  @Input() closeHoverColor = '#e81123';
  @Input() buttonHoverColor = 'rgba(255, 255, 255, 0.1)';
  @Input() width = '400px';
  @Input() height = '500px';
  @Input() title = 'New Window';
  @Input() position: Point = { x: 0, y: 0 };

  @Input() contentBackgroundColor = '#FFF';
  @Input() dockStartX = 0;
  @Input() dockStartY = 0;
  @Input() allowOutOfBounds = false;

  hover = false;
  hoverMax = false;
  hoverMin = false;
  currentInstance = 0;

  isMinimized = false;
  initialLeft = '50%';
  initialTop = '50%';
  currentZ = 0;
  marginLeft = '0px';
  marginTop = '0px';
  maxBoundT = 0;
  maxBoundL = 0;
  maxBoundB = 0;
  maxBoundR = 0;
  popupWidth = 0;
  popupHeight = 0;
  screenHeight = 0;
  screenWidth = 0;

  public _boundaryElement: HTMLElement | string = inject(DOCUMENT).body;
  public readonly dialogRef: DialogRef<TData> = inject<DialogRef<TData>>(
    SDW_DIALOG_REF,
    InjectFlags.Optional
  ) as any;

  constructor(public popup: PopupService, public dialog: DialogService) {
    super();
  }

  ngOnInit(): void {
    this.currentInstance = this.popup.initModal();
    this.currentZ = this.popup.getInitialIndex(this.currentInstance);

    const popupWidth = +replace(/[^0-9]/g, '', this.width);
    const popupHeight = +replace(/[^0-9]/g, '', this.height);

    this.marginLeft = coerceCssPixelValue(-(popupWidth / 2));
    this.marginTop = coerceCssPixelValue(-(popupHeight / 2));

    if (this.allowOutOfBounds) this._boundaryElement = '';

    // this.dialog.updateDialogPosition(this.dialogRef.unique_key, {
    //   x: 0,
    //   y: 0,
    // });
  }

  minimize() {
    this.dialog.dockComponent(this.currentInstance, this.dialogRef);
    // this.isMinimized = !this.isMinimized;

    // if (!this.isMinimized) {
    //   this.currentZ = this.popup.getNewIndex(this.currentInstance);
    //   this.dialog.undockComponent(this.currentInstance);
    // } else {
    //   this.dialog.dockComponent(this.currentInstance, this.dialogRef);
    // }
  }

  onDragBegin() {
    this.currentZ = this.popup.getNewIndex(this.currentInstance);
  }

  onDragEnd({ source }: CdkDragEnd<unknown>) {
    this.position = source.getFreeDragPosition();

    const { top, left } = source.element.nativeElement.getBoundingClientRect();

    this.dialog.updateDialogPosition(this.dialogRef.unique_key, {
      x: left,
      y: top,
    });
  }

  remove_me() {
    console.log(this.dialogRef.parentRef);

    // this.dialog.close(this.currentInstance);

    this.popup.destroyModal(this.currentInstance);
    this.dialog.close(this.dialogRef.unique_key);
  }
}
