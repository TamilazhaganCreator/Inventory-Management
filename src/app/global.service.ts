import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { SerialNumbersModel } from './global.model';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  loader: boolean = false
  routeLoader:boolean = false
  numberOnlyFormatRegex: RegExp = /^[0-9]*$/; 
  numberwith2DecimalRegex: RegExp = /^\d{0,6}(?:\.\d{0,2})?$/;
  private toastShow = new Subject<[String, String, Boolean]>()
  constructor(private db: AngularFirestore) { }

  getLatestSerial() {
    return this.db.collection("serialmaster").get()
  }

  setLatestSerial(value: SerialNumbersModel) {
    return this.db.collection('serialmaster').doc("serials").set({
      customerMaster: value.customerMaster,
      itemMaster: value.itemMaster,
      supplierMaster: value.supplierMaster,
      unitMaster: value.unitMaster,
      taxMaster: value.taxMaster,
      salesHeader: value.salesHeader,
      purchaseHeader: value.purchaseHeader
    })
  }

  updateLatestSerial(value: SerialNumbersModel) {
    return this.db.collection('serialmaster').doc("serials").update({
      customerMaster: value.customerMaster,
      itemMaster: value.itemMaster,
      supplierMaster: value.supplierMaster,
      unitMaster: value.unitMaster,
      taxMaster: value.taxMaster,
      salesHeader: value.salesHeader,
      purchaseHeader: value.purchaseHeader
    })
  }

  toLocaleDateString(date: Date): string {
    var tempDate = date
    return tempDate.getDate() + "/" + (tempDate.getMonth() + 1) + "/" + tempDate.getFullYear()
  }

  showToast(msg: String, type: String, always: Boolean) {
    this.toastShow.next([msg, type, always])
  }

  setToast(): Observable<[String, String, Boolean]> {
    return this.toastShow
  }

}
