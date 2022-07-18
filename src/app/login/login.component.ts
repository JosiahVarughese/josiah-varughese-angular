import {Component, OnInit} from '@angular/core';
import {DataService} from "../data.service";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  needAccount: boolean = false;

  failMessage = '';

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  })

  constructor(private dataService: DataService) { }

  toggleForms() {
    this.failMessage = '';
    this.needAccount = !this.needAccount;
    this.loginForm.patchValue({
      ['username']: '',
      ['password']: ''
    });
  }

  requestRegister() {
    this.failMessage = this.dataService.registerAccount(
      this.loginForm.value.username,
      this.loginForm.value.password,
      true
    );
  }

  requestLogin() {
    this.failMessage =  this.failMessage = this.dataService.login(
      this.loginForm.value.username,
      this.loginForm.value.password
    );
  }

}
