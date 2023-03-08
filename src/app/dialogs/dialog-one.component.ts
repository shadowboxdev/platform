import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectFlags,
  Input,
  OnInit,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SdwDialogRef, SDW_DIALOG_REF } from '@shadowboxdev/dialogs';

@Component({
  selector: 'platform-dialog-one',
  templateUrl: './dialog-one.component.html',
  styleUrls: ['./dialog-one.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogOneComponent<TData> implements OnInit {
  // readonly #dialogRef = inject(SDW_DIALOG_REF, InjectFlags.Optional);

  @Input()
  data: TData | null = null;

  @Input()
  parentRef: any;

  color = '';

  ngOnInit(): void {
    console.log(this.data);
    this.color = this.getRandomColor();
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  close() {
    // this.parentRef.remove(this.#dialogRef?.unique_key);
  }
}
