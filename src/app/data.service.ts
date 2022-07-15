import { Injectable } from '@angular/core';
import {IAccount} from "./interfaces/IAccount";
import { v4 as uuid } from 'uuid';
import {IUser} from "./interfaces/IUser";
import {Subject} from "rxjs";
import {IPost} from "./interfaces/IPost";
import {IMessage} from "./interfaces/IMessage";
import {IThread} from "./interfaces/IThread";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private allAccounts: Array<IAccount>;
  private nullAccount: IAccount = { id: '', username: 'err', password: '', conversations: [] };

  private activeAccount!: IAccount;
  currentUser$: Subject<IUser>;
  private _currentUser!: IUser;
  get currentUser(): IUser {
    return {...this._currentUser};
  }
  private allPosts: Array<IPost>;

  inbox$!: Subject<Array<IThread>>;
  posts$!: Subject<Array<IPost>>;

  constructor() {
    this.allAccounts = [];
    this.allPosts = [];
    this.currentUser$ = new Subject<IUser>();
    this.inbox$ = new  Subject<Array<IThread>>();
    this.posts$ = new Subject<Array<IPost>>();
    this.reassignUser(this.nullAccount);
  }

  //CHANGING THE CURRENT USER/ACCOUNT

  login(username: string, password: string): string {
    if (!username)
      return 'Please enter a username.';
    if(!password)
      return 'Please enter a password.';

    const maybeAccount = this.allAccounts.find(account => account.username === username);
    if (!maybeAccount)
      return "The username entered doesn't belong to any registered accounts.";
    if (password !== maybeAccount.password)
      return "Incorrect password."

    this.reassignUser(maybeAccount);

    return 'Success';
  }

  logout() {
    this.reassignUser(this.nullAccount);
  }

  reassignUser(user: IUser=this.activeAccount) {
    this.activeAccount = this.allAccounts.find(account => account.id === user.id)?? this.nullAccount;
    this.currentUser$.next(this.activeAccount);
    this._currentUser = this.activeAccount;

    if (this.activeAccount.id)
      this.inbox$.next(this.activeAccount.conversations);

    this.posts$.next(this.allPosts);
  }


  //ACCOUNTS

  registerAccount(username: string, password: string, loginOnCreate:boolean=false): string {
    if (!username)
      return 'Please enter a username'
    if (username.length < 4)
      return 'Usernames must be at least 4 characters.'
    if (!password)
      return 'Please enter a password.';
    if (!this.isValidPassword(password))
      return 'Passwords must be at least 6 characters long and include at least one letter, number and special character.'

    const newAccount: IAccount = this.createAccount(username, password);

    this.allAccounts.push(newAccount);

    if (loginOnCreate)
      this.reassignUser(newAccount);

    return 'Success';
  }

  isValidPassword(password: string): boolean {
    if (password.length < 6)
      return false;

    const specialCharacters = '!@#$%^&*()~{}[]|\\/,.<>-_+=?`';
    const numbers = '1234567890';

    let hasSpecialCharacter: boolean = false;
    let hasNumber: boolean = false;
    let hasLetter: boolean = false;

    for (let i = 0; i < password.length; i++) {
      if (!hasSpecialCharacter)
        hasSpecialCharacter = specialCharacters.includes(password[i]);
      if (!hasNumber)
        hasNumber = numbers.includes(password[i]);
      if (!hasLetter)
        hasLetter = password[i].toLowerCase() !== password[i].toUpperCase();
    }

    return hasLetter && hasSpecialCharacter && hasNumber;
  }

  private getAccount(id: string): IAccount {
    return this.allAccounts.find(account => account.id === id)?? this.nullAccount;
  }

  createAccount(username: string, password: string): IAccount {
    return {
      id: uuid(),
      username: username,
      password: password,
      conversations: []
    }
  }

  //USERS

  getUserList(excludeCurrentUser: boolean=false): Array<IUser> {
    const idToExclude: string = excludeCurrentUser ? this.activeAccount.id : '';
    return this.allAccounts.filter(user => user.id !== idToExclude);
  }

  findUserByName(name: string): IUser {
    return this.allAccounts.find(account => account.username === name)?? this.nullAccount;
  }

  //POSTS

  getAllPosts() {
    return this.allPosts.map(post => {
      let postCopy = {...post};
      postCopy.comments = {...postCopy.comments};
      postCopy.comments.messages = [...postCopy.comments.messages];
      return  postCopy;
    });
  }

  private getPost(id: string): IPost | null {
    return this.allPosts.find(post => post.id === id)?? null;
  }

  createPost(title: string='', content: string='', author: IUser=this.activeAccount): IPost {
    return {
      id: uuid(),
      author: author,
      date: this.getRandomDate(),
      title: title,
      content: content,
      comments: this.createConversation([]),
      isNew: true
    }
  }

  updatePost(postData: IPost) {
    let post = this.allPosts.find(post => post.id == postData.id);
    if (post) {
      post.title = postData.title;
      post.content = postData.content;
      post.isNew = false;
    } else {
      postData.isNew = false;
      this.allPosts.push(postData);
    }

    this.posts$.next(this.allPosts);
  }

  deletePost(postToDelete: IPost, user: IUser=this.activeAccount) {
    if (user.id !== postToDelete.author.id)
      return;

    this.allPosts = this.allPosts.filter(post => post.id != postToDelete.id);

    this.posts$.next(this.allPosts);
  }

  addComment(post: IPost, content: string, author: IUser=this.currentUser) {
    let maybePost = this.getPost(post.id);
    if (!maybePost)
      return;

    maybePost.comments.messages.push(this.createMessage(author, maybePost.comments, content, 'comment'));

    this.posts$.next(this.getAllPosts());
  }

  //THREADS

  getDms(): Array<IThread> {
    return this.activeAccount.conversations;
  }

  private createThread(): IThread {
    return {
      id: uuid(),
      users: [],
      messages: []
    }
  }

  private createConversation(users: Array<IUser>): IThread {
    let newThread = this.createThread();
    newThread.users = [...users];

    users.forEach(user => this.getAccount(user.id).conversations.push(newThread));
    this.inbox$.next(this.activeAccount.conversations);

    return newThread;
  }

  getConversation(users: Array<IUser>): IThread {
    const conversations = this.getAccount(users[0].id).conversations;
    let maybeConversation: IThread | null = null;

    conversations.every(conversation => {
      if (
        conversation.users.length === users.length
        && conversation.users.every(user => users.find(userb => userb.id === user.id))
      )
      {

        maybeConversation = conversation;
        return false;
      }
      return true;
    });

    return maybeConversation?? this.createConversation(users);
  }

  //MESSAGES

  private createMessage(author: IUser, thread: IThread, content: string, type: string='dm'): IMessage {
    return {
      type: type,
      id: uuid(),
      author: author,
      thread: thread,
      date: this.getRandomDate(),
      content: content
    }
  }

  sendMessage(content: string, users: Array<IUser>, author: IUser=this.activeAccount) {
    let thread = this.getConversation(users);

    const message: IMessage = this.createMessage(author, thread, content);

    thread.messages.push(message);

    this.inbox$.next(this.activeAccount.conversations);
  }

  updateMessage(messageToUpdate: IMessage, updateType: string) {
    let msgThread: IThread | undefined = this.findMessageThread(messageToUpdate);

    if (!msgThread)
      return;


    if (updateType === 'delete')
      msgThread.messages.filter(message => message.id !== messageToUpdate.id);

    if (updateType === 'update') {
      let maybeMessage: IMessage | undefined = msgThread.messages.find(message => message.id === messageToUpdate.id);

      if (maybeMessage)
        maybeMessage.content = messageToUpdate.content;
    }

    this.updateMessageParentListeners(messageToUpdate);
  }

  updateMessageParentListeners(message: IMessage) {
    if (message.type === 'dm')
      this.inbox$.next(this.activeAccount.conversations);

    if (message.type === 'comment')
      this.posts$.next(this.getAllPosts());
  }

  findMessageThread(message: IMessage): IThread | undefined {
    let thread: IThread | undefined;
    if (message.type === 'dm') {
      thread = this.activeAccount.conversations.find(conversation => conversation.id === message.thread.id);
    }
    if (message.type === 'comment') {
      thread = this.allPosts.find(post => post.comments.id === message.thread.id)?.comments;
    }
    return thread;
  }


  //TESTING

  //DATA POPULATION

  private lastDate: Date = new Date('January 1, 2022');

  getRandomDate() {
    const minDate = this.lastDate.getTime();
    const maxDate = minDate + (1000 * 60 * 60 * 24 * 2);
    this.lastDate = new Date(minDate + (Math.random() * (maxDate - minDate)));
    return this.lastDate;
  }

  populateData() {

    const defaultPassword = 'pa$$w0rd';

    this.registerAccount('MoJo', defaultPassword);
    const mojo: IAccount = this.getAccount(this.findUserByName('MoJo').id);

    const dummyUsernames = [
      'Darth Vader',
      'Saitama',
      'Edgar Allan Poe',
      'John Wick',
      'Rambo',
      'Mr. Miyagi',
      'Albus Percival Wulfric Brian Dumbledore',
      'Stan Lee',
      'Michael Bolton',
      'Jackie Chan',
      'Leonardo da Vinci',
      'Captain Falcon',
      'Batman',
      'Bob Ross',
      'Mr. Rogers',
      'Pikachu'
    ]
    const fillerPostContent = `This is filler content to make it look like people are actually talking about stuff. Would you like me to say more? I don't know if I could! I have said so much already! but really you should stop reading this.`;

    let dummies: Array<IAccount> = [];

    dummyUsernames.forEach(name => {
      this.registerAccount(name, defaultPassword);
      const dummy = {...this.getAccount(this.findUserByName(name).id)}
      dummies.push(dummy);

      this.sendMessage(`Hello MoJo this is ${dummy.username}!`, [mojo, dummy], dummy);
      this.updatePost(this.createPost('A Very Interesting Post About Something', fillerPostContent + '\n\n' + fillerPostContent + '\n\n' + fillerPostContent, dummy));
    });

    this.sendMessage('This is a group message test.', [dummies[0], dummies[1], dummies[2], mojo], dummies[0]);
    this.sendMessage('This is a group message test.', [dummies[0], dummies[1], dummies[2], mojo], dummies[1]);
    this.sendMessage('This is a group message test.', [dummies[0], dummies[1], dummies[2], mojo], dummies[2]);

    this.login(mojo.username, mojo.password);
  }

}
