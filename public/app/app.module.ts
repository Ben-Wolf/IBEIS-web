import { NgModule } from '@angular/core';
import { NgMaterial } from '@angular/';
import { NgMessages } from '@angular/'
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule, XHRBackend } from '@angular/http';

import { workspace-controller } from "./controllers/workspace";
import { wildbook.service } from "./services/wildbook.service";
import { routing } from './app.routing';

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpModule,
    routing
  ],
  declarations: [
    AppComponent,
    wildbook.service,
    FavoriteDirective,
    CategoryListPipe,
    MediaItemFormComponent
  ],
  providers: [
    wildbook.service,
    { provide: lookupListToken, useValue: lookupLists },
    { provide: XHRBackend, useClass: MockXHRBackend }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}
