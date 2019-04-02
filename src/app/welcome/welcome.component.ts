import { Component } from '@angular/core';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {

  private email: string = ""
  private pwd: string = ""
  constructor(private global: GlobalService) { }

}
