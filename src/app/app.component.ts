import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthService } from './auth.service';
import { GlobalService } from './global.service';
import { SerialNumbersModel } from './global.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  latestIdGot = false
  loggedIn = false
  email = ""
  pwd = ""
  masterComponents = ["customer", "item", "supplier", "tax", "unit"]
  transactionComponents = ["sales", "purchase"]
  reportComponents = ["sales", "purchase", "items", "customer", "supplier"]
  @ViewChild("routerArea") routerArea: ElementRef;

  constructor(public global: GlobalService, private router: Router, private auth: AuthService) {
    this.router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        this.global.routeLoader = true
      } else if (event instanceof NavigationEnd) {
        this.global.routeLoader = false
        this.routerArea.nativeElement.click();
      }
    })
  }

  ngOnInit() {
    if (localStorage.getItem('loginStatus') == "LoggedIn") {
      this.loggedIn = true
      this.getSerials();
    } else {
      this.loggedIn = false
    }
  }

  masterNavigate(route: string) {
    if (this.router.url == "/master/" + route) {
      return;
    }
    this.router.navigate(['/master/' + route])
  }

  transactionNavigate(route: string) {
    if (this.router.url == "/transaction/" + route) {
      return;
    }
    this.router.navigate(['/transaction/' + route])
  }

  reportNavigate(route: string) {
    if (this.router.url == "/report/" + route) {
      return;
    }
    this.router.navigate(['/report/' + route])
  }

  backToHome() {
    this.router.navigate([''])
  }

  login() {
    if (this.email && this.pwd) {
      this.global.loader = true
      let email = this.email + "@gmail.com"
      this.auth.doLogin(email, this.pwd)
        .then((res) => {
          console.log(res, "result")
          this.global.loader = false
          localStorage.setItem('loginStatus', "LoggedIn");
          this.loggedIn = true
          this.router.navigate(["/"])
          this.global.showToast("Login success", "success", false)
        }).catch(e => {
          this.global.loader = false
          this.global.showToast("Kindly enter the valid credentials", "warning", false)
        })
    } else {
      this.global.showToast("Kindly enter the details", "warning", false)
    }
  }

  logOut() {
    this.global.loader = true
    this.auth.doLogout()
      .then((res) => {
        this.email = ""
        this.pwd = ""
        this.global.loader = false
        localStorage.setItem('loginStatus', "");
        this.loggedIn = false
        this.global.showToast("Logout success", "success", false)
      }).catch((e) => {
        this.global.loader = false
        this.global.showToast("Logout failed", "warning", false)
      })
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
