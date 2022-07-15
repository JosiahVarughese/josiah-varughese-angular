import {IUser} from "./IUser";
import {IMessage} from "./IMessage";

export interface IThread {
  id: string,
  users: Array<IUser>,
  messages: Array<IMessage>
}
