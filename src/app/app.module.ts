import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { InboxComponent } from './inbox/inbox.component';
import { ThreadComponent } from './thread/thread.component';
import { FeedComponent } from './feed/feed.component';
import { PostComponent } from './post/post.component';
import { MessageComponent } from './message/message.component';
import { LoginComponent } from './login/login.component';
import { UserListComponent } from './user-list/user-list.component';

@NgModule({
  declarations: [
    AppComponent,
    InboxComponent,
    ThreadComponent,
    FeedComponent,
    PostComponent,
    MessageComponent,
    LoginComponent,
    UserListComponent
  ],
  imports: [
    BrowserModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
