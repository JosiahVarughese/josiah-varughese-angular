import { Component, OnInit } from '@angular/core';
import {IUser} from "../interfaces/IUser";
import {DataService} from "../data.service";

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  users: Array<IUser> = [];

  constructor(private dataService: DataService) {
    this.users = this.dataService.getUserList();
  }

  ngOnInit(): void {
  }

}
