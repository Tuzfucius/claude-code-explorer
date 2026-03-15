export interface User {
  id: string;
  name: string;
}

export class UserService {
  listUsers(): User[] {
    return [{ id: "1", name: "Ada" }];
  }
}

