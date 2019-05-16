import { ReportService } from './report.service';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterializeModule } from 'angular2-materialize';
import { GenericLovModule } from '../genericlov/genericlov-module';
import { SalesReportComponent } from './salesreport/salesreport.component';
import { ReportRoutingModule } from './report-routing.module';
import { HotTableModule } from '@handsontable/angular';
import { PurchaseReportComponent } from './purchaserepot/purchasereport.component';
import { ItemreportComponent } from './itemreport/itemreport.component';
import { CustomerreportComponent } from './customerreport/customerreport.component';
import { SupplierreportComponent } from './supplierreport/supplierreport.component';
import { PaymentsComponent } from './payments/payments.component';
import { PersonwiseComponent } from './personwise/personwise.component';

@NgModule({
  imports: [
    CommonModule,
    ReportRoutingModule,
    FormsModule,
    GenericLovModule,
    MaterializeModule,
    HotTableModule
  ],
  declarations: [
    SalesReportComponent,
    PurchaseReportComponent,
    ItemreportComponent,
    CustomerreportComponent,
    SupplierreportComponent,
    PaymentsComponent,
    PersonwiseComponent
  ],
  providers: [
    ReportService
  ]
})
export class ReportModule {

}