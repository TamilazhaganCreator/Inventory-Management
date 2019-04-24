import { Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HotTableRegisterer } from '@handsontable/angular';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { CollapsibleMaterializeAction } from 'src/app/global.model';
import { GlobalService } from 'src/app/global.service';
import { FilterModel } from '../report.model';
import { ReportService } from '../report.service';
import { CustomerModel } from './../../master/master.model';
import { TransactionReportModel } from './../../transaction/transaction.model';

@Component({
  selector: 'app-salesreport',
  templateUrl: './salesreport.component.html',
  styleUrls: ['./salesreport.component.css']
})
export class SalesReportComponent implements OnInit {

  filterCollapsible = new EventEmitter<string | CollapsibleMaterializeAction>();
  private subscriptionArray: Subscription[] = []
  salesHeader: TransactionReportModel[] = []
  private backupSalesHeader: TransactionReportModel[] = []
  filter = new FilterModel()
  paidAmt = 0
  netAmt = 0
  taxAmt = 0
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
    data: this.salesHeader,
    columns: [
      {
        data: 'invoiceNo',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'customerCode',
        type: 'text',
        readOnly: true
      },
      {
        data: 'customerName',
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
        readOnly: true
      },
      {
        data: 'taxAmt',
        type: 'numeric',
        readOnly: true,
      }
    ],
    rowHeaders: true,
    colHeaders: [
      ' INVOICE NO',
      'CUSTOMER CODE',
      'CUSTOMER NAME',
      'DATE',
      'PAYMENT TYPE',
      'PAID AMOUNT',
      'TOTAL AMOUNT',
      'TAX AMOUNT'
    ],
    filters: true,
    height: 440,
    stretchH: 'all',
    rowHeights: 24,
    contextMenu: [{
      name: "View",
      callback: (key, selection, clickEvent) => {
        this.goToSalesPage(selection[0].start.row)
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

  goToSalesPage(index) {
    this.global.loader = true;
    this.router.navigate(['../transaction/sales'], { queryParams: { salesId: this.salesHeader[index].id } });
  }

  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true;
      this.getSales()
    }, 100);
  }

  private getSales() {
    let index = 0
    this.salesHeader = []
    this.backupSalesHeader = []
    this.service.getFullData("salesheader", "timestamp").then((res) => {
      res.forEach((doc) => {
        let element = doc.data() as TransactionReportModel
        element.netAmt = this.roundOff(element.netAmt - element.taxAmt) 
        this.salesHeader[index] = element
        index++;
      })
      this.salesHeader.forEach((element) => {
        let invoiceDate = new Date(element.timestamp)
        let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
        let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
        element.invoiceDateString = date + "/" + month + "/" + invoiceDate.getFullYear()
        element.paymentTypeString = element.paymentType == 0 ? 'Credit' : element.paymentType == 1 ? "Cash" : "Cheque"
      })
      this.backupSalesHeader = this.salesHeader.map(d => Object.assign({}, d))
      this.hotRegisterer.getInstance("hot").loadData(this.salesHeader);
      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }

  removeValue(event) {
    event.target.value = null;
    this.filter.customerCode = null
    this.filter.customerName = null;
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
    if (this.salesHeader.length != this.backupSalesHeader.length) {
      this.salesHeader = this.backupSalesHeader.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.startDate || this.filter.endDate) {
      if (this.filter.startDate && this.filter.endDate) {
        let startRangeArray = this.filter.startDate.split("/")
        let tempStart = new Date(startRangeArray[2] + "-" + startRangeArray[1] + "-" + startRangeArray[0] + " 00:00:00")
        let endRangeArray = this.filter.endDate.split("/")
        let tempEnd = new Date(endRangeArray[2] + "-" + endRangeArray[1] + "-" + endRangeArray[0] + " 00:00:00")
        this.salesHeader = this.backupSalesHeader.filter(s => s.timestamp >= tempStart.getTime() && s.timestamp <= tempEnd.getTime())
        filtered = true
      } else {
        this.global.showToast("Kindly choose the proper start and end date", "warning", false)
      }
    }
    if (this.filter.customerCode) {
      filtered = true
      this.salesHeader = this.backupSalesHeader.filter(s => s.customerCode == this.filter.customerCode)
    }
    if (this.filter.paymentType) {
      filtered = true
      this.salesHeader = this.backupSalesHeader.filter(s => s.paymentTypeString == this.filter.paymentType)
    }
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    if (filtered) {
      this.hotRegisterer.getInstance("hot").loadData(this.salesHeader);
      this.setTotalAmt()
      this.global.showToast("Filters applied", "success", false)
    }
  }

  clearFilter() {
    this.filter = new FilterModel()
    this.salesHeader = this.backupSalesHeader
    this.hotRegisterer.getInstance("hot").loadData(this.salesHeader)
    this.setTotalAmt()
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.global.showToast("Filters cleared", "success", false)
  }

  setTotalAmt() {
    this.paidAmt = this.salesHeader.map(s => s.paidAmt).reduce((a, b) => a + b, 0)
    this.netAmt = this.roundOff(this.salesHeader.map(s => s.netAmt).reduce((a, b) => a + b, 0))
    this.taxAmt = this.roundOff(this.salesHeader.map(s => s.taxAmt).reduce((a, b) => a + b, 0))
  }

  ngOnDestroy(): void {
    this.subscriptionArray.forEach(s => {
      if (s != null)
        s.unsubscribe()
    })
  }

  roundOff(value): number {
    return Math.round(value * Math.pow(10, 2)) / (Math.pow(10, 2));
  }

}
