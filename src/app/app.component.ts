import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GlobalService } from './global.service';

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

  constructor(public global: GlobalService, private router: Router, private auth: AuthService) { }

  ngOnInit() {
    if (localStorage.getItem('loginStatus') == "LoggedIn") {
      this.loggedIn = true
    } else {
      this.loggedIn = false
    }
  }

  masterNavigate(route: string) {
    if (this.router.url == "/master/" + route) {
      return;
    }
    this.global.loader = true
    this.router.navigate(['/master/' + route])
  }

  transactionNavigate(route: string) {
    if (this.router.url == "/transaction/" + route) {
      return;
    }
    this.global.loader = true
    this.router.navigate(['/transaction/' + route])
  }

  reportNavigate(route: string) {
    if (this.router.url == "/report/" + route) {
      return;
    }
    this.global.loader = true
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
}
