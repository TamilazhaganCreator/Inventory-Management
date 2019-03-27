import { AuthService } from './../auth.service';
import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';
import { SerialNumbersModel } from '../global.model';
import { toast } from 'angular2-materialize';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  private email: string = ""
  private pwd: string = ""
  constructor(private global: GlobalService) { }

  ngOnInit() {    
      this.getSerials();
  }

  private getSerials() {
    setTimeout(() => {
      this.global.loader = true;
      this.global.getLatestSerial()
        .subscribe(res => {
          if (res.docs.length == 0) {
            let serials = new SerialNumbersModel();
            serials.unitMaster = serials.taxMaster = serials.supplierMaster = serials.customerMaster = serials.itemMaster = 0;
            serials.salesHeader = serials.purchaseHeader = 0;
            this.global.setLatestSerial(serials).then(res => {
              this.global.loader = false;
            }).catch(e => {
              this.global.showToast("Error occured" + e, "error", true);
            });
          }
          else {
            this.global.loader = false;
          }
        });
    }, 100);
  }
}
