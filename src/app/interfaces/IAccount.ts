import {IUser} from "./IUser";
import {IThread} from "./IThread"

export interface IAccount extends IUser {
  password: string,
  conversations: Array<IThread>
}
