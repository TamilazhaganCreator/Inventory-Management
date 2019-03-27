import { GenericLovService } from './../../genericlov/genericlov.service';
import { GlobalService } from './../../global.service';
import { MasterService } from './../master.service';
import { TaxModel } from './../master.model';
import { Component, OnInit } from '@angular/core';
import { toast } from 'angular2-materialize';
import { SerialNumbersModel } from 'src/app/global.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-taxmaster',
  templateUrl: './taxmaster.component.html',
  styleUrls: ['./taxmaster.component.css', '../master.component.css']
})
export class TaxmasterComponent implements OnInit {

  taxObject = new TaxModel()
  numberwith2DecimalRegex: RegExp = /^\d{0,8}(?:\.\d{0,2})?$/;
  private serials = new SerialNumbersModel()
  private latestId = 0
  private subscriptions: Subscription[] = []

  constructor(private masterService: MasterService, private global: GlobalService, private lovService: GenericLovService) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "tax")
          this.taxObject = res[0]
      })
  }


  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true
      this.getLatestItem()
    }, 100);
  }

  saveTax() {
    if (this.taxObject.cgst_perc && this.taxObject.sgst_perc && this.taxObject.igst_perc && this.taxObject.cess_perc != undefined) {
      if (this.checkIgst()) {
        if (this.taxObject.code)
          this.updateTax()
        else
          this.addTax();
      }
    } else {
      this.global.showToast("Kindly fill all the details", "warning", false)
    }
  }

  private updateTax() {
    this.global.loader = true;
    this.masterService.updateTax(this.taxObject)
      .then(res => {
        this.taxObject = new TaxModel();
        this.global.loader = false
        this.global.showToast("Tax updated successfully", "success", false)
      }).catch(e => {
        this.global.showToast("Error occured" + e.toString(), "error", true);
      });
  }

  private addTax() {
    this.taxObject.code = this.latestId;
    this.global.loader = true;
    this.masterService.addTax(this.taxObject)
      .then(res => {
        this.updateSerials();
      }).catch(e => {
        this.global.showToast("Error occured" + e.toString(), "error", true);
      });
  }

  private getLatestItem() {
    this.global.getLatestSerial().subscribe(res => {
      if (res.docs.length > 0) {
        this.serials = res.docs[0].data() as SerialNumbersModel
        this.latestId = this.serials.taxMaster + 1
      } else {
        this.latestId = 1
      }
      this.global.loader = false
    }, error => { 
      this.global.showToast("Error occurred" + error, "error", true)
    })
  }

  updateSerials() {
    this.serials.taxMaster = this.serials.taxMaster + 1
    this.global.updateLatestSerial(this.serials)
      .then(res => {
        this.taxObject = new TaxModel();
        this.latestId++;
        this.global.loader = false
        this.global.showToast("Tax added successfully", "success", false)
      }).catch(e => { this.global.showToast("Error occured" + e, "error", true) })
  }

  clearItem() {
    this.taxObject = new TaxModel();
  }

  checkNumbersValue(event, field) {
    if (this.numberwith2DecimalRegex.test(event.target.value)) {
      if (event.target.value != '') {
        this.taxObject[field] = +event.target.value
      } else {
        this.taxObject[field] = null
      }
    } else {
      event.target.value = this.taxObject[field] ? this.taxObject[field] : ''
    }
  }

  checkIgst(): boolean {
    if (this.taxObject.igst_perc != (this.taxObject.cgst_perc + this.taxObject.sgst_perc)) {
      this.global.showToast("IGST value must be equal to sum of cgst and sgst", "warning", false)
      return false
    }
    return true
  }

  viewAllTax() {
    this.lovService.showLovModal(true, "tax", "", 0)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(element => {
      if (element != null)
        element.unsubscribe()
    })
  }
}
