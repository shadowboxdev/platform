import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { AppComponent } from './app.component';
import { NxWelcomeComponent } from './nx-welcome.component';

import { appRoutes } from './app.routes';

import { DialogOneComponent } from './dialogs/dialog-one.component';
import { DialogsModule } from '@shadowboxdev/dialogs';

@NgModule({
  declarations: [AppComponent, NxWelcomeComponent, DialogOneComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    BrowserAnimationsModule,
    MatButtonModule,
    DialogsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
