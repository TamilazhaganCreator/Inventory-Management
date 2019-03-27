import { Subscription } from 'rxjs';
import { CustomerModel } from './../../master/master.model';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { TransactionReportModel } from './../../transaction/transaction.model';
import { GlobalService } from 'src/app/global.service';
import { Component, OnInit, EventEmitter } from '@angular/core';
import { ReportService } from '../report.service';
import { FilterModel } from '../report.model';
import { HotTableRegisterer } from '@handsontable/angular';
import { CollapsibleMaterializeAction } from 'src/app/global.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchasereport',
  templateUrl: './purchasereport.component.html',
  styleUrls: ['./purchasereport.component.css']
})
export class PurchaseReportComponent implements OnInit {

  filterCollapsible = new EventEmitter<string | CollapsibleMaterializeAction>();
  private subscriptionArray: Subscription[] = []
  purchaseHeader: TransactionReportModel[] = []
  private backupPurchaseHeader: TransactionReportModel[] = []
  filter = new FilterModel()
  paidAmt = 0
  netAmt = 0
  datePickerParams = [
    {
      format: "dd/mm/yyyy",
      close: "Ok",
      clear: "",
      min: this.filter.startDate
    }
  ];
  private hotRegisterer = new HotTableRegisterer();
  hotSettings: Handsontable.GridSettings = {
    data: this.purchaseHeader,
    columns: [
      {
        data: 'invoiceNo',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'supplierCode',
        type: 'numeric',
        readOnly: true
      },
      {
        data: 'supplierName',
        type: 'text',
        readOnly: true
      },
      {
        data: 'invoiceDateString',
        type: 'text',
        className: "htCenter",
        readOnly: true
      },
      {
        data: 'paymentTypeString',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'paidAmt',
        type: 'numeric',
        readOnly: true
      },
      {
        data: 'netAmt',
        type: 'numeric',
        readOnly: true,
      }
    ],
    rowHeaders: true,
    colHeaders: [
      ' INVOICE NO',
      'SUPPLIER CODE',
      'SUPPLIER NAME',
      'DATE',
      'PAYMENT TYPE',
      'PAID AMOUNT',
      'NET AMOUNT'
    ],
    filters: true,
    height: 440,
    stretchH: 'all',
    rowHeights: 24,
    contextMenu: [{
      name: "View",
      callback: (key, selection, clickEvent) => {
        this.goToPurchasePage(selection[0].start.row)
      }
    }]
  };

  constructor(private global: GlobalService, private service: ReportService, private lovService: GenericLovService,
    private router: Router) {
    this.subscriptionArray[0] = this.lovService.getLovItem()
      .subscribe((res) => {
        if (res[1] == "Customer") {
          let cust = res[0] as CustomerModel;
          this.filter.customerName = cust.name
          this.filter.customerCode = cust.code
        }
      })
  }

  goToPurchasePage(index) {
    this.global.loader = true;
    this.router.navigate(['../transaction/purchase'], { queryParams: { purchaseId: this.purchaseHeader[index].id } });
  }

  ngOnInit() {
    this.getPurchase()
  }

  private getPurchase() {
    let index = 0
    this.purchaseHeader = []
    this.backupPurchaseHeader = []
    this.service.getFullData("purchaseHeader", "timestamp").then((res) => {
      res.forEach((doc) => {
        this.purchaseHeader[index] = doc.data() as TransactionReportModel
        index++;
      })
      this.purchaseHeader.forEach((element) => {
        let invoiceDate = new Date(element.timestamp)
        let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
        let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
        element.invoiceDateString = date + "/" + month + "/" + invoiceDate.getFullYear()
        element.paymentTypeString = element.paymentType == 0 ? 'Credit' : element.paymentType == 1 ? "Cash" : "Cheque"
      })
      this.backupPurchaseHeader = this.purchaseHeader.map(d => Object.assign({}, d))
      this.hotRegisterer.getInstance("hot").loadData(this.purchaseHeader);
      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }

  setTotalAmt() {
    this.paidAmt = this.purchaseHeader.map(s => s.paidAmt).reduce((a, b) => a + b, 0)
    this.netAmt = this.purchaseHeader.map(s => s.netAmt).reduce((a, b) => a + b, 0)
  }

  private removeValue(event) {
    event.target.value = null;
    this.global.showToast("Kindly select the customer", "warning", false)
  }

  setDate(event, field) {
    this.filter[field] = event.target.value.toString()
  }

  getCustomers() {
    this.lovService.showLovModal(true, "Customer", "", null)
  }

  applyFilter() {
    let filtered = false
    if (this.purchaseHeader.length != this.backupPurchaseHeader.length) {
      this.purchaseHeader = this.backupPurchaseHeader.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.startDate || this.filter.endDate) {
      if (this.filter.startDate && this.filter.endDate) {
        let startRangeArray = this.filter.startDate.split("/")
        let tempStart = new Date(startRangeArray[2] + "-" + startRangeArray[1] + "-" + startRangeArray[0] + " 00:00:00")
        let endRangeArray = this.filter.endDate.split("/")
        let tempEnd = new Date(endRangeArray[2] + "-" + endRangeArray[1] + "-" + endRangeArray[0] + " 00:00:00")
        this.purchaseHeader = this.backupPurchaseHeader.filter(s => s.timestamp >= tempStart.getTime() && s.timestamp <= tempEnd.getTime())
        filtered = true
      } else {
        this.global.showToast("Kindly choose the proper start and end date", "warning", false)
      }
    }
    if (this.filter.customerCode) {
      filtered = true
      this.purchaseHeader = this.backupPurchaseHeader.filter(s => s.customerCode == this.filter.customerCode)
    }
    if (this.filter.paymentType) {
      filtered = true
      this.purchaseHeader = this.backupPurchaseHeader.filter(s => s.paymentTypeString == this.filter.paymentType)
    }
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    if (filtered) {
      this.hotRegisterer.getInstance("hot").loadData(this.purchaseHeader);
      this.setTotalAmt()
      this.global.showToast("Filters applied", "success", false)
    }
  }

  clearFilter() {
    this.filter = new FilterModel()
    this.purchaseHeader = this.backupPurchaseHeader
    this.hotRegisterer.getInstance("hot").loadData(this.purchaseHeader)
    this.setTotalAmt()
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.global.showToast("Filters cleared", "success", false)
  }

  ngOnDestroy(): void {
    this.subscriptionArray.forEach(s => {
      if (s != null)
        s.unsubscribe()
    })
  }
}
