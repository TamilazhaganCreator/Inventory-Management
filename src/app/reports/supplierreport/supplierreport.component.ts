import { CustomerModel } from 'src/app/master/master.model';
import { Component, OnInit } from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import { GlobalService } from 'src/app/global.service';
import { ArrayAscSortPipe } from '../../utils/sortasc.pipe';
import { ArrayDescSortPipe } from '../../utils/sortdesc.pipe';
import { ReportService } from '../report.service';
import { PersonFilterModel } from '../report.model';
import * as Handsontable from 'handsontable';

@Component({
  selector: 'app-supplierreport',
  templateUrl: './supplierreport.component.html',
  styleUrls: ['./supplierreport.component.css']
})
export class SupplierreportComponent implements OnInit {

  supplierDetails: CustomerModel[] = []
  private backupSupplierDetails: CustomerModel[] = []
  filter: PersonFilterModel = new PersonFilterModel()
  totalAmt = 0

  constructor(private global: GlobalService, private service: ReportService) { }

  private hotRegisterer = new HotTableRegisterer();
  hotSettings: Handsontable.GridSettings = {
    data: this.supplierDetails,
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
      'SUPPLIER CODE',
      'SUPPLIER NAME',
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
    this.getSuppliers()
    },100);
  }

  getSuppliers() {
    let index = 0
    this.supplierDetails = []
    this.backupSupplierDetails = []
    this.service.getFullData("suppliermaster", "name").then((res) => {
      res.forEach((doc) => {
        this.supplierDetails[index] = doc.data() as CustomerModel
        index++;
      })
      this.backupSupplierDetails = this.supplierDetails.map(d => Object.assign({}, d))
      this.hotRegisterer.getInstance("hot").loadData(this.supplierDetails);
      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }


  filterSuppliers() {
    let filtered = false
    if (this.supplierDetails.length != this.backupSupplierDetails.length) {
      this.supplierDetails = this.backupSupplierDetails.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.amountType) {
      if (this.filter.amountType == "credit") {
        this.supplierDetails = this.backupSupplierDetails.filter(c => c.amount < 0)
      } else {
        this.supplierDetails = this.backupSupplierDetails.filter(c => c.amount > 0)
      }
      filtered = true
    }
    if (this.filter.name) {
      this.supplierDetails = this.backupSupplierDetails.filter(i => i.name.includes(this.filter.name))
      filtered = true
    }
    if (this.filter.sortType) {
      let typeSplits = this.filter.sortType.split("_")
      if (typeSplits[1] == "asc")
        this.supplierDetails = new ArrayAscSortPipe().transform(this.supplierDetails, typeSplits[0])
      else
        this.supplierDetails = new ArrayDescSortPipe().transform(this.supplierDetails, typeSplits[0])
      filtered = true
    }
    if (filtered) {
      this.hotRegisterer.getInstance("hot").loadData(this.supplierDetails);
      this.setTotalAmt()
      this.global.showToast("Suppliers filtered", "success", false)
    }
  }

  setTotalAmt() {
    this.totalAmt = this.supplierDetails.map(i => i.amount).reduce((a, b) => a + b, 0)
  }

  clearFilter() {
    this.filter = new PersonFilterModel()
    this.supplierDetails = this.backupSupplierDetails.map(d => Object.assign({}, d))
    this.hotRegisterer.getInstance("hot").loadData(this.supplierDetails);
    this.setTotalAmt()
    this.global.showToast("Filter cleared", "success", false)
  }
}
