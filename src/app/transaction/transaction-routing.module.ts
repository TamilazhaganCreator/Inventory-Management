import { PurchaseComponent } from './purchase/purchase.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalestransactionComponent } from './salestransaction/salestransaction.component';


const routes: Routes = [
    { path: '', component: SalestransactionComponent },
    { path: 'sales', component: SalestransactionComponent },
    { path: 'purchase', component: PurchaseComponent },
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TransactionRoutingModule { }
