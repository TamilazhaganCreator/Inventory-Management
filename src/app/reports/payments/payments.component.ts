import { ArrayAscSortPipe } from './../../utils/sortasc.pipe';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import { CollapsibleMaterializeAction } from 'src/app/global.model';
import { GlobalService } from 'src/app/global.service';
import { ReportService } from '../report.service';
import { GenericLovService } from './../../genericlov/genericlov.service';
import { CashPaymentModel } from './../../transaction/transaction.model';
import { FilterModel } from './../report.model';
import { Subscription } from 'rxjs';
import { CustomerModel } from 'src/app/master/master.model';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {

  filter = new FilterModel()
  filterCollapsible = new EventEmitter<string | CollapsibleMaterializeAction>();
  paymentDetails: CashPaymentModel[] = []
  personType = null;
  totalAmt = 0;
  private hotRegisterer = new HotTableRegisterer();
  private subscriptionArray: Subscription[] = []
  hotSettings: Handsontable.GridSettings = {
    data: this.paymentDetails,
    columns: [
      {
        data: 'dateString',
        type: 'text',
        className: "htCenter",
        readOnly: true
      },
      {
        data: 'note',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'name',
        type: 'text',
        readOnly: true
      },
      {
        data: 'paymentType',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'amount',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      }
    ],
    rowHeaders: true,
    colHeaders: [
      'DATE',
      'NOTES',
      'NAME',
      'PAYMENT TYPE',
      'Amount'
    ],
    filters: true,
    height: 440,
    stretchH: 'all',
    rowHeights: 24
  };

  constructor(private global: GlobalService, private service: ReportService,
    private lovService: GenericLovService) {
    this.subscriptionArray[0] = this.lovService.getLovItem()
      .subscribe((res) => {
        if (res[1] == "supplier" || res[1] == "customer") {
          let cust = res[0] as CustomerModel;
          this.filter.customerName = cust.name
          this.filter.customerCode = cust.code
        }
      })
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

  setDateString() {
    this.paymentDetails.forEach((element) => {
      let invoiceDate = new Date(element.timestamp)
      let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
      let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
      element.dateString = date + "/" + month + "/" + invoiceDate.getFullYear()
    })
  }

  search() {
    if (this.personType == null) {
      this.global.showToast("Kindly select the person type", "warning", false)
      return;
    }

    if (this.filter.startTimestamp) {
      if (this.filter.endTimestamp) {
        // this.service.getFullPaymentWithName(this.personType, this.filter).then((res) => {
        //   this.paymentDetails = []
        //   console.log("response", res)
        //   res.docs.forEach(element => {
        //     let s = element.data() as CashPaymentModel
        //     this.paymentDetails.push(s)
        //   });
        //   this.assignData();
        // }).catch((e) => { })
        // } else {
        this.global.loader = true
        this.service.getFullPaymentWithRange(this.personType, this.filter).then((res) => {
          this.paymentDetails = []
          console.log("response", res)
          res.docs.forEach(element => {
            let s = element.data() as CashPaymentModel
            this.paymentDetails.push(s)
          });
          if (this.filter.customerCode) {
            this.paymentDetails = this.paymentDetails.filter(p => p.code == this.filter.customerCode)
          }
          this.assignData();
          this.global.loader = false
        }).catch((e) => { })
        // }
      } else {
        this.global.showToast("Kindly select end date", "warning", false)
      }
    } else {
      this.global.showToast("Kindly select start date", "warning", false)
    }
  }


  clearFilter() {
    this.filter = new FilterModel()
    this.paymentDetails = []
    this.hotRegisterer.getInstance("hot").loadData(this.paymentDetails)
    this.totalAmt = 0
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.global.showToast("Filters cleared", "success", false)
  }

  private assignData() {
    this.setDateString();
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.totalAmt = this.roundOff(this.paymentDetails.map(p => p.amount).reduce((a, b) => a + b, 0))
    this.hotRegisterer.getInstance("hot").loadData(this.paymentDetails);
  }

  roundOff(value): number {
    return Math.round(value * Math.pow(10, 2)) / (Math.pow(10, 2));
  }

  resetName() {
    this.filter.customerCode = null;
    this.filter.customerName = null;
  }

}
