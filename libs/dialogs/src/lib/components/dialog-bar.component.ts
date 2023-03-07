import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { move } from 'ramda';
import { BehaviorSubject } from 'rxjs';
import { DockedDialogRef, SdwDialogConfig } from '../models';
import { DialogService, PopupService } from '../services/dialog.service';

@Component({
  selector: 'sdw-dialog-bar',
  templateUrl: './dialog-bar.component.html',
  styleUrls: ['./dialog-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogBarComponent implements OnDestroy {
  readonly config!: SdwDialogConfig;
  readonly dockItems$ = new BehaviorSubject<DockedDialogRef<unknown>[]>([]);
  readonly subscription = this.dialog.minimizedDialogs$.subscribe(
    this.dockItems$
  );

  currentInstance = 0;

  constructor(public dialog: DialogService, public popup: PopupService) {
    dialog.minimizedDialogs$.subscribe(this.dockItems$);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.dockItems$.complete();
  }

  onDrop(event: CdkDragDrop<DockedDialogRef<unknown>[]>) {
    const nextValue = move(
      event.previousIndex,
      event.currentIndex,
      this.dockItems$.value
    );

    this.dockItems$.next(nextValue);
  }

  onClose(minimized: DockedDialogRef<unknown>) {
    this.dialog.close(minimized.dialogRef.unique_key);
  }

  restore(minimized: DockedDialogRef<unknown>): void {
    // this.popup.getNewIndex(this.currentInstance);
    this.dialog.undockComponent(minimized.dialogRef.unique_key);
  }

  moveLeft() {
    this.dialog.moveDockerComponent(-1);
  }

  moveRight() {
    this.dialog.moveDockerComponent(1);
  }
}
