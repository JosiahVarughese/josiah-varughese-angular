import { Component, OnInit } from '@angular/core';
import {IUser} from "../interfaces/IUser";
import {DataService} from "../data.service";

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {

  users: Array<IUser> = [];

  constructor(private dataService: DataService) {
    this.users = this.dataService.getUserList();
  }

  goToUserDm(user: IUser) {
    if (user.id === this.dataService.currentUser.id)
      return;

    this.dataService.setConversation([this.dataService.currentUser, user]);
    this.dataService.changeTab('inbox');
  }
}
