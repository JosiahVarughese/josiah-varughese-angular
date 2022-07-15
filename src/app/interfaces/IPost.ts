import {IThread} from "./IThread";
import {IPostable} from "./IPostable";

export interface IPost extends IPostable{
  title: string,
  comments: IThread,
  isNew: boolean
}
