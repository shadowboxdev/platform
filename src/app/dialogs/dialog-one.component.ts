import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { DIALOG_ID } from '@shadowboxdev/dialogs';

@Component({
  selector: 'platform-dialog-one',
  templateUrl: './dialog-one.component.html',
  styleUrls: ['./dialog-one.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogOneComponent implements OnInit {
  @Input() data: any = {};
  @Input() parentRef: any;

  unique_key = inject(DIALOG_ID);

  color: any = '';

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
    this.parentRef.remove(this.unique_key);
  }
}
