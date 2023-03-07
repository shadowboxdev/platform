import { Component, ViewContainerRef } from '@angular/core';
import { DialogService } from '@shadowboxdev/dialogs';
import { DialogOneComponent } from './dialogs/dialog-one.component';

@Component({
  selector: 'platform-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'platform';

  constructor(
    public viewContainerRef: ViewContainerRef,
    public dialog: DialogService
  ) {}

  createComponent() {
    const data = { test: 'test' };
    this.dialog.createComponent(DialogOneComponent, data, {
      title: 'test title',
    });
  }

  moveRoute() {
    // this.router.navigate(['r']);
  }
}
