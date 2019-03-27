import { ArrayDescSortPipe } from './../../utils/sortdesc.pipe';
import { ArrayAscSortPipe } from './../../utils/sortasc.pipe';
import { FilterModel } from './../report.model';
import { ReportService } from './../report.service';
import { GlobalService } from 'src/app/global.service';
import { Component, OnInit } from '@angular/core';
import { ItemModel } from 'src/app/master/master.model';
import { HotTableRegisterer } from '@handsontable/angular';
import { ItemFilterModel } from '../report.model';

@Component({
  selector: 'app-itemreport',
  templateUrl: './itemreport.component.html',
  styleUrls: ['./itemreport.component.css']
})
export class ItemreportComponent implements OnInit {

  itemDetails: ItemModel[] = []
  private backupItemDetails: ItemModel[] = []
  filter: ItemFilterModel = new ItemFilterModel()
  totalStock = 0
  totalPurchase = 0
  totalSales = 0

  constructor(private global: GlobalService, private service: ReportService) { }

  private hotRegisterer = new HotTableRegisterer();
  hotSettings: Handsontable.GridSettings = {
    data: this.itemDetails,
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
        data: 'stock',
        type: 'numeric',
        readOnly: true
      },
      {
        data: 'sales',
        type: 'numeric',
        readOnly: true
      },
      {
        data: 'purchase',
        type: 'numeric',
        readOnly: true
      }],
    rowHeaders: true,
    colHeaders: [
      'ITEM CODE',
      'ITEM NAME',
      'STOCK',
      'SALES',
      'PURCHASE'
    ],
    filters: true,
    height: 440,
    stretchH: 'all',
    rowHeights: 24,
  }

  ngOnInit() {
    this.getItems()
  }

  getItems() {
    let index = 0
    this.itemDetails = []
    this.backupItemDetails = []
    this.service.getFullData("itemmaster", "name").then((res) => {
      res.forEach((doc) => {
        this.itemDetails[index] = doc.data() as ItemModel
        index++;
      })
      this.backupItemDetails = this.itemDetails.map(d => Object.assign({}, d))
      this.hotRegisterer.getInstance("hot").loadData(this.itemDetails);
      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }

  filterItems() {
    let filtered = false
    if (this.itemDetails.length != this.backupItemDetails.length) {
      this.itemDetails = this.backupItemDetails.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.name) {
      this.itemDetails = this.backupItemDetails.filter(i => i.name.includes(this.filter.name))
      filtered = true
    }
    if (this.filter.sortType) {
      let typeSplits = this.filter.sortType.split("_")
      if (typeSplits[1] == "asc")
        this.itemDetails = new ArrayAscSortPipe().transform(this.itemDetails, typeSplits[0])
      else
        this.itemDetails = new ArrayDescSortPipe().transform(this.itemDetails, typeSplits[0])
      filtered = true
    }
    if (filtered) {
      this.hotRegisterer.getInstance("hot").loadData(this.itemDetails);
      this.setTotalAmt()
      this.global.showToast("Items filtered", "success", false)
    }
  }

  setTotalAmt() {
    this.totalPurchase = this.itemDetails.map(i => i.purchase).reduce((a, b) => a + b, 0)
    this.totalSales = this.itemDetails.map(i => i.sales).reduce((a, b) => a + b, 0)
    this.totalStock = this.itemDetails.map(i => i.stock).reduce((a, b) => a + b, 0)
  }

  clearFilter() {
    this.filter = new ItemFilterModel()
    this.itemDetails = this.backupItemDetails.map(d => Object.assign({}, d))
    this.hotRegisterer.getInstance("hot").loadData(this.itemDetails);
    this.setTotalAmt()
    this.global.showToast("Filter cleared", "success", false)
  }
}
