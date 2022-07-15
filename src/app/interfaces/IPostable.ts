import {IUser} from "./IUser";

export interface IPostable {
  id: string,
  author: IUser,
  date: Date,
  content: string
}
