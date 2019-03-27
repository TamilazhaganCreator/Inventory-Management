import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomermasterComponent } from './customermaster/customermaster.component';
import { ItemmasterComponent } from './itemmaster/itemmaster.component';
import { TaxmasterComponent } from './taxmaster/taxmaster.component';
import { UnitmasterComponent } from './unitmaster/unitmaster.component';


const routes: Routes = [
    { path: '', component: CustomermasterComponent },
    { path: 'unit', component: UnitmasterComponent },
    { path: 'item', component: ItemmasterComponent },
    { path: 'customer', component: CustomermasterComponent },
    { path: 'supplier', component: CustomermasterComponent },
    { path: 'tax', component: TaxmasterComponent }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MasterRoutingModule { }
