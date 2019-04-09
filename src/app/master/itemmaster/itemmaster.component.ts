import { TaxModel } from './../master.model';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { toast } from 'materialize-css';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { GlobalService } from 'src/app/global.service';
import { HsnModel, ItemModel, UnitModel } from '../master.model';
import { MasterService } from '../master.service';
import { SerialNumbersModel } from 'src/app/global.model';

@Component({
  selector: 'app-itemmaster',
  templateUrl: './itemmaster.component.html',
  styleUrls: ['./itemmaster.component.css', '../master.component.css']
})
export class ItemmasterComponent implements OnInit {

  currentItem: ItemModel = new ItemModel()
  private latestId: number = 0;
  private subscriptions: Subscription[] = []
  private serials = new SerialNumbersModel();
  @ViewChild("spInput") private spInput: ElementRef;
  @ViewChild("nameInput") private nameInput: ElementRef;
  @ViewChild("taxInput") private taxInput: ElementRef;
  @ViewChild("stockInput") private stockInput: ElementRef;


  constructor(private global: GlobalService, private service: MasterService, private lovService: GenericLovService) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "items") {
          this.currentItem = res[0]
          this.currentItem.removeStock = this.currentItem.addStock = 0
          // } else if (res[1] == "unit") {
          //   let unit = res[0] as UnitModel
          //   this.currentItem.unit = unit.unit
          //   this.taxInput.nativeElement.focus()
          // }
        } else if (res[1] == "tax") {
          let tax = res[0] as TaxModel
          this.currentItem.taxPercentage = tax.cess_perc + tax.cgst_perc + tax.sgst_perc
          this.currentItem.cgst_perc = tax.cgst_perc
          this.currentItem.sgst_perc = tax.sgst_perc
          this.currentItem.igst_perc = tax.igst_perc
          this.stockInput.nativeElement.focus()
        }
      })

    this.subscriptions[1] = this.lovService.getLovLastFocus()
      .subscribe(res => {
        if (res != -1) {
          this.nameInput.nativeElement.focus()
        }
      })
  }

  ngOnInit() {
    this.currentItem.unit = 1
    setTimeout(() => {
      this.global.loader = true
      this.getLatestItem()
    }, 100);
  }

  removeTypedValue(event, from) {
    this.currentItem.taxPercentage = null
    this.lovService.showLovModal(true, from, "", 0)
  }

  checkTwoDecimalPlaces(event, field: string) {
    if (this.global.numberwith2DecimalRegex.test(event.target.value)) {
      if (event.target.value != '')
        this.currentItem[field] = +(event.target.value)
      else
        this.currentItem[field] = null
    } else {
      event.target.value = this.currentItem[field] ? this.currentItem[field] : ''
    }
  }

  checkNumberOnly(event, field: string) {
    if (this.global.numberOnlyFormatRegex.test(event.target.value)) {
      if (event.target.value != '')
        this.currentItem[field] = +(event.target.value)
      else
        this.currentItem[field] = null
    } else {
      event.target.value = this.currentItem[field] ? this.currentItem[field] : ''
    }
  }

  private getLatestItem() {
    this.global.getLatestSerial().subscribe(res => {
      if (res.docs.length > 0) {
        this.serials = res.docs[0].data() as SerialNumbersModel
        this.latestId = this.serials.itemMaster + 1
      } else {
        this.latestId = 1
      }
      this.global.loader = false
    }, error => {
      this.global.showToast("Error occurred" + error, "error", true)
    })
  }

  private setItemStock() {
    if (this.currentItem.addStock) {
      this.currentItem.stock = this.currentItem.stock + this.currentItem.addStock
    }

    if (this.currentItem.removeStock) {
      this.currentItem.stock = this.currentItem.stock - this.currentItem.removeStock
    }
    if (this.currentItem.lessPurchase) {
      this.currentItem.purchase = this.currentItem.purchase - this.currentItem.lessPurchase
      this.currentItem.stock = this.currentItem.stock - this.currentItem.lessPurchase
    }
    if (this.currentItem.lessSales) {
      this.currentItem.sales = this.currentItem.sales - this.currentItem.lessSales
      this.currentItem.stock = this.currentItem.stock + this.currentItem.lessSales
    }
  }


  saveItem() {
    if (this.currentItem.name != null && this.currentItem.cost != null && this.currentItem.name != '' &&
      this.currentItem.sp != null && this.currentItem.stock != null && this.currentItem.unit != null &&
      this.currentItem.unit != 0 && this.currentItem.hsncode != null && this.currentItem.taxPercentage != null) {
      if (this.checkSp()) {
        if (this.currentItem.code == null) {
          this.addItem()
        } else {
          this.setItemStock()
          this.updateItem()
        }
      }
    } else {
      this.global.showToast("Kindly fill all the details", "warning", false)
    }
  }

  clearItem() {
    this.currentItem = new ItemModel()
    this.currentItem.unit = 1
    this.global.showToast("Reset successfully", "warning", false)
    // if (this.currentItem.code == null) {
    //   this.currentItem = new ItemModel()
    //   this.global.showToast("Reset successfully", "warning", false)
    // } else {
    //   this.global.loader = true
    //   this.service.deleteItem("itemmaster", this.currentItem.code.toString())
    //     .then(res => {
    //       this.global.showToast("Deleted successfully", "warning", false)
    //       this.global.loader = false
    //       this.currentItem = new ItemModel()
    //     }).catch(e => {
    //       this.global.showToast("Error occured" + e, "error", true)
    //     })
    // }
  }

  checkSp(): boolean {
    if (this.currentItem.sp < this.currentItem.cost) {
      this.spInput.nativeElement.focus();
      this.global.showToast("Selling price must be greater than or equal to cost", "warning", false)
      return false
    }
    return true
  }

  showTax() {
    this.currentItem.taxPercentage = null
    this.lovService.showLovModal(true, "tax", "", 0)
  }

  showLovModal(event, from) {
    console.log(event, "event")
    if (event.keyCode == 13) {
      this.lovService.showLovModal(true, from, "", 0)
    }
  }

  viewAllItems() {
    this.lovService.showLovModal(true, "items", "", 0)
  }

  addItem() {
    this.global.loader = true
    this.currentItem.code = this.latestId
    this.service.addItem(this.currentItem)
      .then(res => {
        this.updateSerials();
      }).catch(e => {
        this.global.loader = false
        this.global.showToast("Error occured " + e, "error", true)
      })
  }

  updateSerials() {
    this.serials.itemMaster = this.serials.itemMaster + 1
    this.global.updateLatestSerial(this.serials)
      .then(res => {
        this.currentItem = new ItemModel();
        this.currentItem.unit = 1
        this.latestId++;
        this.global.loader = false
        this.global.showToast("Item added successfully", "success", false)
      }).catch(e => {
        this.global.showToast("Error occured" + e, "error", true)
      })
  }

  updateItem() {
    this.global.loader = true
    this.service.updateItem(this.currentItem)
      .then(res => {
        this.currentItem = new ItemModel();
        this.global.loader = false
        this.global.showToast("Item updated successfully", "success", false)
      }).catch(e => {
        this.global.loader = false
        this.global.showToast("Error occured " + e, "error", true)
      })
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(element => {
      if (element != null)
        element.unsubscribe()
    })
  }
}
