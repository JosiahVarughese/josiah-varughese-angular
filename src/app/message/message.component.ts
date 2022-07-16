import {Component, Input, OnInit} from '@angular/core';
import {IMessage} from "../interfaces/IMessage";
import {FormControl, FormGroup} from "@angular/forms";
import {DataService} from "../data.service";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {

  @Input() messageData!: IMessage;
  repeatMsg: boolean = false;
  editing: boolean = false;
  focused: boolean = false;

  editForm: FormGroup = new FormGroup({
    content: new FormControl('')
  })

  constructor(private dataService: DataService) {}

  ngOnInit() {
    const index = this.messageData.thread.messages.findIndex(message => message.id === this.messageData.id)
    this.repeatMsg = index > 0 && this.messageData.thread.messages[index - 1].author.id === this.messageData.author.id;
  }

  toggleEdit() {
    this.editing = !this.editing;

    if (this.editing)
      this.editForm.patchValue({
        ['content']: this.messageData.content
      })
  }

  isMessageAuthor(): boolean {
    return this.messageData.author.id === this.dataService.currentUser.id;
  }

  requestUpdate(updateType: string) {
    this.messageData.content = this.editForm.value.content;
    this.dataService.updateMessage(this.messageData, updateType);
  }

}
