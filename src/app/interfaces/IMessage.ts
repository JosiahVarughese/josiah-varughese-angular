import {IThread} from "./IThread";
import {IPostable} from "./IPostable";

export interface IMessage extends IPostable{
  type: string,
  thread: IThread
}
