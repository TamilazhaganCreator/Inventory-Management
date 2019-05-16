import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashpaymentsComponent } from './cashpayments/cashpayments.component';
import { PurchaseComponent } from './purchase/purchase.component';
import { SalestransactionComponent } from './salestransaction/salestransaction.component';


const routes: Routes = [
    { path: '', component: SalestransactionComponent },
    { path: 'sales', component: SalestransactionComponent },
    { path: 'purchase', component: PurchaseComponent },
    { path: 'payments', component: CashpaymentsComponent },
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TransactionRoutingModule { }
