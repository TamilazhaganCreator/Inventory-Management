import { ArrayAscSortPipe } from './../../utils/sortasc.pipe';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { CashPaymentModel } from './../../transaction/transaction.model';
import { GlobalService } from './../../global.service';
import { FilterModel } from './../report.model';
import { Component, OnInit, EventEmitter } from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import { ReportService } from '../report.service';
import { TransactionReportModel } from 'src/app/transaction/transaction.model';
import { CollapsibleMaterializeAction } from 'src/app/global.model';
import { CustomerModel } from 'src/app/master/master.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-personwise',
  templateUrl: './personwise.component.html',
  styleUrls: ['./personwise.component.css']
})
export class PersonwiseComponent implements OnInit {

  filter = new FilterModel();
  transactionArray: TransactionReportModel[] = []
  subscriptionArray: Subscription[] = []
  totalIncome: number = 0
  totalAmt: number = 0

  constructor(private global: GlobalService, private service: ReportService,
    private lovService: GenericLovService, private router: Router) {
    this.subscriptionArray[0] = this.lovService.getLovItem()
      .subscribe((res) => {
        if (res[1] == "supplier" || res[1] == "customer") {
          let cust = res[0] as CustomerModel;
          this.filter.customerName = cust.name
          this.filter.customerCode = cust.code
          this.filter.personAmount = cust.amount
        }
      })
  }
  private hotRegisterer = new HotTableRegisterer();
  private transactionDetails = []
  filterCollapsible = new EventEmitter<string | CollapsibleMaterializeAction>();
  private personType = null;
  hotSettings: Handsontable.GridSettings = {
    data: this.transactionDetails,
    columns: [
      {
        data: 'invoiceDateString',
        type: 'text',
        className: "htCenter",
        readOnly: true
      }, {
        data: 'invoiceNo',
        type: 'text',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'customerName',
        type: 'text',
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
      }
    ],
    rowHeaders: true,
    colHeaders: [
      'DATE',
      ' INVOICE NO / NOTE',
      'CUSTOMER NAME',
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
  }

  ngOnInit() {
  }

  setDate(event, field) {
    this.filter[field] = event.target.value.toString()
    var dateArray = event.target.value.toString().split("/")
    let s = new Date(dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0] + " 00:00:00")
    if (field == "startDate")
      this.filter.startTimestamp = s.getTime()
    else
      this.filter.endTimestamp = s.getTime()
  }


  viewAll() {
    if (this.personType) {
      this.lovService.showLovModal(true, this.personType, "", 0)
    } else {
      this.global.showToast("Kindly select the person type", "warning", false)
    }
  }


  removeValue(event) {
    event.target.value = null;
    this.filter.customerCode = null
    this.filter.customerName = null;
    this.global.showToast("Kindly select the Supplier", "warning", false)
  }

  search() {
    if (this.personType == null) {
      this.global.showToast("Kindly select the person type", "warning", false)
      return;
    }
    if (this.filter.customerCode == null) {
      this.global.showToast("Kindly select the person name", "warning", false)
      return;
    }
    if (this.filter.startTimestamp == null || this.filter.endTimestamp == null) {
      this.global.showToast("Kindly select the date range", "warning", false)
      return;
    }
    this.global.loader = true
    this.transactionArray = []
    let transaction = this.personType == 'supplier' ? 'purchaseHeader' : 'salesheader'
    this.service.getFullTransactonWithRange(transaction, this.filter).then((res) => {
      res.forEach((doc) => {
        let element = doc.data() as TransactionReportModel
        this.transactionArray.push(element)
      })
      this.transactionArray.forEach((element) => {
        let invoiceDate = new Date(element.timestamp)
        let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
        let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
        element.invoiceDateString = date + "/" + month + "/" + invoiceDate.getFullYear()
        element.paymentTypeString = element.paymentType == 0 ? 'Credit' : element.paymentType == 1 ? "Cash" : "Cheque"
      })
      let index = this.transactionArray.length
      this.service.getFullPaymentWithRange(this.personType, this.filter).then((res) => {
        res.forEach((doc) => {
          let element = doc.data() as CashPaymentModel
          let transaction = new TransactionReportModel()
          transaction.customerCode = element.code;
          transaction.customerName = element.name.toString();
          transaction.invoiceNo = "PAYMENT - " + element.note.toString();
          transaction.paymentTypeString = element.paymentType;
          transaction.timestamp = element.timestamp;
          transaction.paidAmt = element.amount
          transaction.netAmt = 0
          let invoiceDate = new Date(element.timestamp)
          let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
          let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
          transaction.invoiceDateString = date + "/" + month + "/" + invoiceDate.getFullYear()
          this.transactionArray[index] = transaction
          index++;
        })
        if (this.filter.customerCode) {
          this.transactionArray = this.transactionArray.filter(t => t.customerCode == this.filter.customerCode)
        }
        this.setTotalAmt();
        this.transactionArray = new ArrayAscSortPipe().transform(this.transactionArray, "timestamp")
        this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
        this.hotRegisterer.getInstance("hot").loadData(this.transactionArray);
        this.global.loader = false
      }).catch((e) => { })
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    }).catch((e) => { })
  }

  clearFilter() {
    this.filter = new FilterModel()
    this.transactionArray = []
    this.hotRegisterer.getInstance("hot").loadData(this.transactionArray)
    this.setTotalAmt()
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.global.showToast("Filters cleared", "success", false)
  }

  goToPurchasePage(index) {
    if (this.transactionArray[index].invoiceNo.includes("PAYMENT")) {
      this.global.showToast("It's a payment record", "warning", false)
      return;
    }
    this.global.loader = true;
    if (this.personType == 'supplier') {
      this.router.navigate(['../transaction/purchase'], { queryParams: { purchaseId: this.transactionArray[index].id } });
    } else {
      this.router.navigate(['../transaction/sales'], { queryParams: { salesId: this.transactionArray[index].id } });
    }
  }


  roundOff(value: number): number {
    return Math.round(value * Math.pow(10, 2)) / (Math.pow(10, 2));
  }

  setTotalAmt() {
    this.totalAmt = this.roundOff(this.transactionArray.map(t => t.netAmt).reduce((a, b) => a + b, 0))
    this.totalIncome = this.roundOff(this.transactionArray.map(t => t.paidAmt).reduce((a, b) => a + b, 0))
  }

  resetName() {
    this.filter.customerCode = null;
    this.filter.customerName = null;
  }
}

