import { Injectable } from '@angular/core';
import {IAccount} from "./interfaces/IAccount";
import { v4 as uuid } from 'uuid';
import {IUser} from "./interfaces/IUser";
import {Subject} from "rxjs";
import {IPost} from "./interfaces/IPost";
import {IMessage} from "./interfaces/IMessage";
import {IThread} from "./interfaces/IThread";
import {IPostable} from "./interfaces/IPostable";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private nullAccount: IAccount = { id: '', username: 'err', password: '', conversations: [] };

  private activeAccount!: IAccount;
  private _currentUser!: IUser;
  get currentUser(): IUser { return {...this._currentUser}; }

  private allAccounts: Array<IAccount>;
  private allPosts: Array<IPost>;

  currentUser$: Subject<IUser>;
  posts$!: Subject<Array<IPost>>;
  inbox$!: Subject<Array<IThread>>;

  constructor() {
    this.allAccounts = [];
    this.allPosts = [];
    this.currentUser$ = new Subject<IUser>();
    this.inbox$ = new  Subject<Array<IThread>>();
    this.posts$ = new Subject<Array<IPost>>();
    this.reassignUser(this.nullAccount);
  }


  //LOGIN & REGISTRATION

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
    this._currentUser = this.activeAccount;
    this.currentUser$.next(this.currentUser);

    if (this.activeAccount.id)
      this.inbox$.next(this.getActiveAccountInbox());

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
    let accountListCopy: Array<IAccount> = this.allAccounts.filter(account => account.id !== idToExclude);
    return accountListCopy.map(account => { return {...account} as IUser });
  }

  findUserByName(name: string): IUser {
    return this.allAccounts.find(account => account.username === name)?? this.nullAccount;
  }


  //POSTS

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

  getAllPosts() {
    return this.allPosts.map(post => {
      let postCopy = {...post};
      postCopy.comments = {...postCopy.comments};
      postCopy.comments.messages = [...postCopy.comments.messages];
      return  postCopy;
    });
  }

  sortFeedByDate(posts: Array<IPost>, ascDesc: string='asc') {
    const ascDescValue: number = ascDesc === 'asc' ? -1 : 1;
    posts.sort((postableA, postableB) => {
      if (postableA.date > postableB.date)
        return ascDescValue;
      if (postableA.date < postableB.date)
        return -ascDescValue;
      return 0;
    });
  }

  private getPost(id: string): IPost | null {
    return this.allPosts.find(post => post.id === id)?? null;
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


  //INBOX

  sortInboxByDate(threads: Array<IThread>, ascDesc: string='asc') {
    const ascDescValue: number = ascDesc === 'asc' ? -1 : 1;
    threads.sort((threadA, threadB) => {
      const lastMessageA = threadA.messages[threadA.messages.length - 1];
      const lastMessageB = threadB.messages[threadB.messages.length - 1];
      if (lastMessageA.date > lastMessageB.date)
        return ascDescValue;
      if (lastMessageA.date < lastMessageB.date)
        return -ascDescValue;
      return 0;
    });
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
    this.inbox$.next(this.getActiveAccountInbox());

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

  getActiveAccountInbox() {
    return this.activeAccount.conversations.map(conversation => {
      let conversationCopy = {...conversation};
      conversationCopy.messages = [...conversationCopy.messages];
      conversationCopy.users = [...conversationCopy.users];
      return  conversationCopy;
    })
  }

  sendMessage(content: string, users: Array<IUser>, author: IUser=this.activeAccount) {
    let thread = this.getConversation(users);

    const message: IMessage = this.createMessage(author, thread, content);

    thread.messages.push(message);

    this.inbox$.next(this.getActiveAccountInbox());
  }

  updateMessage(messageToUpdate: IMessage, updateType: string) {
    let msgThread: IThread | undefined = this.findMessageThread(messageToUpdate);

    if (!msgThread)
      return;

    if (updateType === 'delete')
      msgThread.messages = msgThread.messages.filter(message => message.id !== messageToUpdate.id);

    if (updateType === 'update') {
      let maybeMessage: IMessage | undefined = msgThread.messages.find(message => message.id === messageToUpdate.id);

      if (maybeMessage)
        maybeMessage.content = messageToUpdate.content;
    }

    this.updateMessageParentListeners(messageToUpdate);
  }

  private updateMessageParentListeners(message: IMessage) {
    if (message.type === 'dm')
      this.inbox$.next(this.getActiveAccountInbox());

    if (message.type === 'comment')
      this.posts$.next(this.getAllPosts());
  }

  private findMessageThread(message: IMessage): IThread | undefined {
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

  fillerSentences: Array<string> = [
    'I hate snakes',
    'Did you know monkeys not only eat bananas but a variety of other fruits, meats and vegetables as well?',
    'This sentence is just here to take up space but you are welcome to read it.',
    'Do you ever get bored of reading meaningless text?',
    "That's right, big cats and small cats have different types of pupils, though we aren't sure why small cats pupils are narrow we do know it is common to find these types of eyes in creatures that hunt low to the ground.",
    `There are a few ways to increase the intensity of an exercise:
     1 - Increase the range of motion
     2 - Perform the eccentric contraction explosively
     3 - increase the weight you are lifting`
  ]

  fillerTitles: Array<string> = [
    'How to Get MORE $',
    'All About $',
    'Want More $? 10 Steps to Getting $',
    'Miraculous $',
    'My Journey Towards $',
    "Why I Stopped $ and You Should Too",
    'The Ultimate Guide to $'
  ];
  fillerSubjects: Array<string> = [
    'Bananas',
    'Avocados',
    'Monkhood',
    'Money',
    'Fat',
    'Muscle',
    'Sleep',
    'Potatoes',
    'Kittens'
  ]

  getRandomInteger(min: number, max: number): number {
    return Math.round(min + ((max - min) * Math.random()));
  }

  getRandomSentence(): string {
    return this.fillerSentences[this.getRandomInteger(0, this.fillerSentences.length - 1)];
  }

  getRandomPostTitle(): string {
    let newRandomTitle = ''
    const randomTitle = this.fillerTitles[this.getRandomInteger(0, this.fillerTitles.length - 1)];
    for (let i = 0; i < randomTitle.length; i++) {
      if (randomTitle[i] === '$') {
        newRandomTitle += ` ${this.fillerSubjects[this.getRandomInteger(0, this.fillerSubjects.length - 1)]} `;
      } else {
        newRandomTitle += randomTitle[i];
      }
    }
    return newRandomTitle;
  }

  getRandomPostContent(): string {
    let randomPostContent = '';
    const numberOfSentences = this.getRandomInteger(1, 10);
    for (let i = 0; i < numberOfSentences; i++) {
      if (i !== 0) {
        const indentationChance = this.getRandomInteger(1, 100);
        randomPostContent += indentationChance < 50 ? ' ' : indentationChance > 80 ? '\n\n' : '\n';
      }
      randomPostContent += this.getRandomSentence();
    }
    return randomPostContent;
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
      'Pikachu',
      "Dwayne 'the Rock' Johnson",
      'Tobey Maguire'
    ]

    let dummies: Array<IAccount> = [];

    dummyUsernames.forEach(name => {
      this.registerAccount(name, defaultPassword);
      const dummy = {...this.getAccount(this.findUserByName(name).id)}
      dummies.push(dummy);

      this.updatePost(this.createPost(this.getRandomPostTitle(), this.getRandomPostContent(), dummy));
    });

    dummies.forEach(dummy => {
      for (let i = 0; i < this.getRandomInteger(4, 8); i++) {
        const userToPm = this.getUserList(true)[this.getRandomInteger(0, this.allAccounts.length - 1)];
        console.log(dummy.username + ': ' + userToPm.username);
        this.sendMessage(this.getRandomSentence(), [userToPm, dummy], dummy);
      }

      for (let i = 0; i < this.getRandomInteger(1, 10); i++) {
        const randomPost = this.allPosts[this.getRandomInteger(0, this.allPosts.length - 1)];
        this.addComment(randomPost, this.getRandomSentence(), dummy);
      }

      this.sendMessage(`Hello MoJo this is ${dummy.username}!`, [mojo, dummy], dummy);
    });

    this.sendMessage(this.getRandomSentence(), [dummies[0], dummies[1], dummies[2], mojo], dummies[0]);
    this.sendMessage(this.getRandomSentence(), [dummies[0], dummies[1], dummies[2], mojo], dummies[1]);
    this.sendMessage(this.getRandomSentence(), [dummies[0], dummies[1], dummies[2], mojo], dummies[2]);

    this.login(mojo.username, mojo.password);
  }

}
