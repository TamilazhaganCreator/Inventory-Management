import { Component, OnInit } from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import { GlobalService } from 'src/app/global.service';
import { CustomerModel } from 'src/app/master/master.model';
import { ArrayAscSortPipe } from './../../utils/sortasc.pipe';
import { ArrayDescSortPipe } from './../../utils/sortdesc.pipe';
import { ReportService } from './../report.service';
import { PersonFilterModel } from '../report.model';
import * as Handsontable from 'handsontable';

@Component({
  selector: 'app-customerreport',
  templateUrl: './customerreport.component.html',
  styleUrls: ['./customerreport.component.css']
})
export class CustomerreportComponent implements OnInit {

  customerDetails: CustomerModel[] = []
  private backupCustomerDetails: CustomerModel[] = []
  filter: PersonFilterModel = new PersonFilterModel()
  totalAmt = 0

  constructor(private global: GlobalService, private service: ReportService) { }

  private hotRegisterer = new HotTableRegisterer();
  hotSettings: Handsontable.GridSettings = {
    data: this.customerDetails,
    columns: [
      {
        data: 'code',
        type: 'numeric',
        readOnly: true,
        className: "htCenter"
      },
      {
        data: 'name',
        type: 'numeric',
        readOnly: true
      },
      {
        data: 'amount',
        type: 'numeric',
        readOnly: true,
        className: "htRight",
        renderer: function (instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.TextRenderer.apply(this, arguments);
          if (parseInt(value, 10) < 0) {
            td.style.color = "red"
          }
          return td;
        }
      }],
    rowHeaders: true,
    colHeaders: [
      'CUSTOMER CODE',
      'CUSTOMER NAME',
      'AMOUNT'
    ],
    filters: true,
    height: 440,
    stretchH: 'all',
    rowHeights: 24
  }

  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true;
      this.getCustomers()
    }, 100);
  }

  getCustomers() {
    let index = 0
    this.customerDetails = []
    this.backupCustomerDetails = []
    this.service.getFullData("customermaster", "name").then((res) => {
      res.forEach((doc) => {
        this.customerDetails[index] = doc.data() as CustomerModel
        index++;
      })
      this.backupCustomerDetails = this.customerDetails.map(d => Object.assign({}, d))
      this.hotRegisterer.getInstance("hot").loadData(this.customerDetails);
      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }


  filterCustomers() {
    let filtered = false
    if (this.customerDetails.length != this.backupCustomerDetails.length) {
      this.customerDetails = this.backupCustomerDetails.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.amountType) {
      if (this.filter.amountType == "credit") {
        this.customerDetails = this.backupCustomerDetails.filter(c => c.amount < 0)
      } else {
        this.customerDetails = this.backupCustomerDetails.filter(c => c.amount > 0)
      }
      filtered = true
    }
    if (this.filter.name) {
      this.customerDetails = this.backupCustomerDetails.filter(i => i.name.includes(this.filter.name))
      filtered = true
    }
    if (this.filter.sortType) {
      let typeSplits = this.filter.sortType.split("_")
      if (typeSplits[1] == "asc")
        this.customerDetails = new ArrayAscSortPipe().transform(this.customerDetails, typeSplits[0])
      else
        this.customerDetails = new ArrayDescSortPipe().transform(this.customerDetails, typeSplits[0])
      filtered = true
    }
    if (filtered) {
      this.hotRegisterer.getInstance("hot").loadData(this.customerDetails);
      this.setTotalAmt()
      this.global.showToast("Customers filtered", "success", false)
    }
  }

  setTotalAmt() {
    this.totalAmt = this.customerDetails.map(i => i.amount).reduce((a, b) => a + b, 0)
  }

  clearFilter() {
    this.filter = new PersonFilterModel()
    this.customerDetails = this.backupCustomerDetails.map(d => Object.assign({}, d))
    this.hotRegisterer.getInstance("hot").loadData(this.customerDetails);
    this.setTotalAmt()
    this.global.showToast("Filter cleared", "success", false)
  }
}
