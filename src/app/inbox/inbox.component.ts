import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {IThread} from "../interfaces/IThread";
import {DataService} from "../data.service";
import {Subscription} from "rxjs";
import {IUser} from "../interfaces/IUser";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit, OnDestroy {

  @Input() initialConversationId!: string;

  inboxSub!: Subscription;
  inboxData: Array<IThread> = [];
  displayInbox: Array<IThread> = [];

  messageForm: FormGroup = new FormGroup({
    messageText: new FormControl('')
  });

  activeConversation!: IThread;
  activeConversationId : string = '';

  userList: Array<IUser> = [];
  userDisplayList: Array<IUser> = [];
  searchText: string = '';
  filterText: string = '';
  isNewConversation: boolean = false;
  newConversationUsers: Array<IUser> = [];

  constructor(private dataService: DataService) {
    this.inboxSub = dataService.inbox$.subscribe(inbox => this.onInboxUpdate(inbox));
    this.onInboxUpdate(this.dataService.getDms());
  }

  ngOnInit() {
    this.activeConversationId = this.initialConversationId;
  }

  onInboxUpdate(inbox: Array<IThread>) {
    this.inboxData = inbox;
    this.displayInbox = [...inbox];
    this.dataService.sortInboxByDate(this.displayInbox);
    this.userList = this.dataService.getUserList(true);
  }

  ngOnDestroy() {
    this.inboxSub.unsubscribe();
  }

  onChangeConversation() {
    this.isNewConversation = false;
    const maybeThread = this.inboxData.find(thread => thread.id === this.activeConversationId);
    if (maybeThread)
      this.activeConversation = maybeThread;
  }

  startNewConversation() {
    this.isNewConversation = true;
    this.activeConversationId = 'New';
  }

  requestSendMessage() {
    if (!this.isNewConversation) {
      this.dataService.sendMessage(this.messageForm.value.messageText, this.activeConversation.users);
    } else {
      this.newConversationUsers.push(this.dataService.currentUser);
      const newConversation = this.dataService.getConversation(this.newConversationUsers);
      this.dataService.sendMessage(this.messageForm.value.messageText, newConversation.users);
      this.newConversationUsers = [];
      this.isNewConversation = false;
      this.activeConversationId = newConversation.id;
    }
    this.messageForm.patchValue({['messageText']: ''});
  }

  getThreadName(thread: IThread): string {
    let name = '';
    thread.users.forEach(user => {
      if (user.id !== this.dataService.currentUser.id)
        name += name ? ', ' + user.username : user.username;
    });

    return name;
  }

  addRecipient(user: IUser) {
    this.newConversationUsers.push(user);
    this.searchText = '';
  }

  removeParticipant(user: IUser) {
    this.newConversationUsers = this.newConversationUsers.filter(otherUser => otherUser.id !== user.id);
  }

  clearSearch() {
    setTimeout(() => this.userDisplayList = [], 300);
  }

  onSearchUpdate(text: string) {
    this.searchText = text;
    this.userDisplayList = this.userList
      .filter(user =>
        !this.newConversationUsers.find(otherUser => otherUser.id === user.id)
        && user.username.toLowerCase().includes(this.searchText.toLowerCase())
      );
  }

  filterConversations(newText: string) {
    this.filterText = newText;
    this.displayInbox = this.inboxData.filter(conversation => {
      const conversationName = this.getThreadName(conversation);
      return conversationName.toLowerCase().includes(this.filterText.toLowerCase());
    });
  }

}
