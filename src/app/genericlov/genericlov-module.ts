import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GenericLovComponent } from './genericlov.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
      GenericLovComponent
  ],
  exports:[
      GenericLovComponent
  ]
})
export class GenericLovModule { 

}