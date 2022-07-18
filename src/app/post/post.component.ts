import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IPost} from "../interfaces/IPost";
import {DataService} from "../data.service";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {

  @Output() makeRequest = new EventEmitter<string>();
  @Input() postData!: IPost;
  @Input() activePostId!: string;

  isEditing: boolean = false;
  isOwner: boolean = false;
  showComments: boolean = false;
  focused: boolean = false;

  postForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    content: new FormControl('')
  })

  commentForm: FormGroup = new FormGroup({
    commentText: new FormControl('')
  })

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.isEditing = this.postData.isNew;
    this.isOwner = this.verifyOwnership();
    this.showComments = this.postData.id === this.activePostId;
  }

  editPost() {
    if (this.isOwner)
      this.isEditing = true;
  }

  cancelEdits() {
    this.isEditing = false;

    if(this.postData.isNew)
      this.makeRequest.emit('reset');
  }

  requestUpdatePost() {
    this.postData.title = this.postForm.value.title;
    this.postData.content = this.postForm.value.content;
    this.dataService.updatePost(this.postData);
    this.isEditing = false;
    this.makeRequest.emit('focus');
  }

  requestAddComment() {
    if (!this.commentForm.value.commentText)
      return;

    this.dataService.addComment(this.postData, this.commentForm.value.commentText);
    this.commentForm.patchValue({['commentText']: ''});
    this.makeRequest.emit('focus');
  }

  verifyOwnership(): boolean {
    return this.postData.author.id === this.dataService.currentUser.id;
  }

  requestDelete() {
    this.dataService.deletePost(this.postData);
  }

}
