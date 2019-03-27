import { CustomerreportComponent } from './customerreport/customerreport.component';
import { ItemreportComponent } from './itemreport/itemreport.component';
import { PurchaseReportComponent } from './purchaserepot/purchasereport.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesReportComponent } from './salesreport/salesreport.component';
import { SupplierreportComponent } from './supplierreport/supplierreport.component';


const routes: Routes = [
    { path: '', component: SalesReportComponent },
    { path: 'sales', component: SalesReportComponent },
    { path: 'purchase', component: PurchaseReportComponent },
    { path: 'items', component: ItemreportComponent },
    { path: 'customer', component: CustomerreportComponent },
    { path: 'supplier', component: SupplierreportComponent }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReportRoutingModule { }
