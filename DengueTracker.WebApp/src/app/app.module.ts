import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SelectButtonModule } from 'primeng/selectbutton'
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AgmCoreModule } from '@agm/core';

declare var config;

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    SelectButtonModule,
    ProgressSpinnerModule,
    AgmCoreModule.forRoot({
      apiKey: config.gmapsApiKey
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
