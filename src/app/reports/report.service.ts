import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private db: AngularFirestore) { }

  getFullData(collection,field) {
    return this.db.collection(collection).ref.orderBy(field).get()
  }

 
}
