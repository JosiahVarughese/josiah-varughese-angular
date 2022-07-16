import {Component, OnInit} from '@angular/core';
import {DataService} from "./data.service";
import {Subscription} from "rxjs";
import {IUser} from "./interfaces/IUser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'josiah-varughese-angular';

  userSub!: Subscription;
  currentUser!: IUser;

  loggedIn: boolean = false;
  activeTab: string = 'inbox';

  constructor(private dataService: DataService) {
    this.userSub = this.dataService.currentUser$.subscribe(user => this.onUserChange(user));
    this.dataService.reassignUser();
  }

  onUserChange(user: IUser) {
    this.currentUser = user;
    this.loggedIn = !!user.id;
  }

  ngOnInit() {
    this.dataService.populateData();
  }

  requestLogout() {
    this.dataService.logout();
  }
}
