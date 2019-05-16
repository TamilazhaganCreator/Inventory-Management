import { FilterModel } from './report.model';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private db: AngularFirestore) { }

  getFullData(collection, field) {
    return this.db.collection(collection).ref.orderBy(field).get()
  }

  getFullPaymentWithRange(collection, filter: FilterModel) {
    return this.db.collection(collection + "payments").ref
      .where("timestamp", ">=", filter.startTimestamp)
      .where("timestamp", "<=", filter.endTimestamp)
      .orderBy("timestamp")
      .get()
  }

  getFullPaymentWithName(collection, filter: FilterModel) {
    return this.db.collection(collection + "payments").ref
      .where("code", "==", filter.customerCode)
      .get()
  }

  getFullTransactonWithRange(collection, filter: FilterModel) {
    return this.db.collection(collection).ref
      .where("timestamp", ">=", filter.startTimestamp)
      .where("timestamp", "<=", filter.endTimestamp)
      .orderBy("timestamp")
      .get()
  }

}
