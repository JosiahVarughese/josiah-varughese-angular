import {Component, OnDestroy} from '@angular/core';
import {IPost} from "../interfaces/IPost";
import {DataService} from "../data.service";
import {Subscription} from "rxjs";

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

  constructor(private dataService: DataService) {
    this.postsSub = dataService.posts$.subscribe(posts => this.onFeedUpdate(posts));
    this.onFeedUpdate(this.dataService.getAllPosts());
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
    this.displayPosts = [...this.postsData].reverse();//todo
    this.isPosting = false;
  }

  resetDisplayList() {
    this.onFeedUpdate(this.postsData);
  }

  ngOnDestroy(): void {
    this.postsSub.unsubscribe();
  }

  handlePostRequest(post:IPost, request: string) {
    if (request === 'reset')
      this.resetDisplayList();
    if (request === 'focus') {
      this.lastFocusedId = post.id;
    }
  }

}
