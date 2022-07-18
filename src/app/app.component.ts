import {Component, OnDestroy, OnInit} from '@angular/core';
import {DataService} from "./data.service";
import {Subscription} from "rxjs";
import {IUser} from "./interfaces/IUser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'josiah-varughese-angular';

  userSub!: Subscription;
  currentUser!: IUser;

  loggedIn: boolean = false;
  activeTab: string = 'inbox';
  tabSub!: Subscription;

  constructor(private dataService: DataService) {
    this.userSub = this.dataService.currentUser$.subscribe(user => this.onUserChange(user));
    this.onUserChange(this.dataService.currentUser);

    this.tabSub = this.dataService.activeTab$.subscribe(tab => this.onTabChange(tab));
    this.onTabChange(this.dataService.activeTab);
  }

  onUserChange(user: IUser) {
    this.currentUser = user;
    this.loggedIn = !!user.id;
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
  }

  ngOnInit() {
    this.dataService.populateData();
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.tabSub.unsubscribe();
  }

  requestLogout() {
    this.dataService.logout();
  }
}
