import { Component, inject, ViewContainerRef } from '@angular/core';
import { DialogService, SdwDialog } from '@shadowboxdev/dialogs';
import { DialogOneComponent } from './dialogs/dialog-one.component';

@Component({
  selector: 'platform-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'platform';
  readonly #dialog = inject(SdwDialog);

  constructor(
    public viewContainerRef: ViewContainerRef,
    public dialog: DialogService
  ) {}

  createComponent() {
    const data = { test: 'test' };
    this.#dialog.open(DialogOneComponent, {
      data,
    });
    // this.dialog.createComponent(DialogOneComponent, data, {
    //   title: 'test title',
    // });
  }

  moveRoute() {
    // this.router.navigate(['r']);
  }
}
