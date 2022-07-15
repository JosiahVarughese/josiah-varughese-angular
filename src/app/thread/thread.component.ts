import {Component, Input, OnInit} from '@angular/core';
import {IThread} from "../interfaces/IThread";
import {DataService} from "../data.service";

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.css']
})
export class ThreadComponent implements OnInit {

  @Input() threadData!: IThread;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
  }

}
