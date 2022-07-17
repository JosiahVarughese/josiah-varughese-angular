import {Component, OnDestroy} from '@angular/core';
import {IPost} from "../interfaces/IPost";
import {DataService} from "../data.service";
import {filter, Subscription} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {IUser} from "../interfaces/IUser";

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnDestroy {

  postsSub!: Subscription;
  postsData: Array<IPost> = [];
  displayPosts: Array<IPost> = [];

  isPosting = false;

  lastFocusedId: string = '';

  searchContext: string = 'Search';

  filters: { [name: string]: string } = {
    'Title': '',
    'Author': '',
    'Content': ''
  };

  searchForm: FormGroup = new FormGroup({
    searchText: new FormControl('')
  })
  formSub!: Subscription;

  filterKeys: Array<string> = [];
  activeFilters: Array<string> = [];
  displayUsers: Array<IUser> = [];
  displayTitles: Array<string> = [];

  constructor(private dataService: DataService) {
    this.postsSub = dataService.posts$.subscribe(posts => this.onFeedUpdate(posts));
    this.onFeedUpdate(this.dataService.getAllPosts());
    this.formSub = this.searchForm.valueChanges.subscribe(value => this.onSearchUpdate(value));
  }

  addNewPost() {
    let newPost: IPost = this.dataService.createPost();
    this.displayPosts = [...this.postsData];
    this.displayPosts.push(newPost);
    this.displayPosts.reverse();
    this.isPosting = true;
  }

  onFeedUpdate(posts: Array<IPost>) {
    this.postsData = posts;
    this.displayPosts = [...this.postsData];
    this.dataService.sortFeedByDate(this.displayPosts);
    this.isPosting = false;
  }

  resetDisplayList() {
    this.onFeedUpdate(this.postsData);
  }

  ngOnDestroy(): void {
    this.postsSub.unsubscribe();
    this.formSub.unsubscribe();
  }

  handlePostRequest(post:IPost, request: string) {
    if (request === 'reset')
      this.resetDisplayList();
    if (request === 'focus') {
      this.lastFocusedId = post.id;
    }
  }

  onSearchUpdate(text: string) {
    this.filterKeys = Object.keys(this.filters).filter(key => !this.activeFilters.includes(key));
    if (this.searchContext === 'Author')
      this.displayUsers = this.getDisplayUsers();
    if (this.searchContext === 'Content')
      this.filterPosts();
    if (this.searchContext === 'Title')
      this.displayTitles = this.getPostTitles();
  }

  unfocusSearch(sync: boolean=false) {
    if (sync) {
      this.filterKeys = [];
      return;
    }

    setTimeout(() => this.filterKeys = [], 300);
  }

  setSearchContext(context: string) {
    this.searchContext = context;
  }

  clearFilter(filterKey: string) {
    this.filters[filterKey] = '';
    this.activeFilters = this.activeFilters.filter(key => key !== filterKey);
    this.filterPosts();
  }

  setSearchContextValue(value: string=this.searchForm.value.searchText) {
    if (!this.searchContext || this.searchContext === 'Content')
      return;

    this.filters[this.searchContext] = value;
    this.activeFilters.push(this.searchContext);
    this.searchContext = 'Search';
    this.searchForm.patchValue({ ['searchText']: '' });
    this.filterPosts();
    this.unfocusSearch();
  }

  filterPosts() {
    this.displayPosts = this.postsData.filter(post =>
      post.title.toLowerCase().includes(this.filters['Title'].toLowerCase())
      && post.author.username.toLowerCase().includes(this.filters['Author'].toLowerCase())
      && post.content.toLowerCase().includes(this.searchForm.value.searchText)
    );
    this.dataService.sortFeedByDate(this.displayPosts);
  }

  getDisplayUsers(): Array<IUser> {
    return this.dataService.getUserList().filter(user => user.username.toLowerCase().includes(this.searchForm.value.searchText.toLowerCase()));
  }

  getPostTitles(): Array<string> {
    return this.postsData.map(post => post.title).filter(title => title.toLowerCase().includes(this.searchForm.value.searchText.toLowerCase()));
  }

}
