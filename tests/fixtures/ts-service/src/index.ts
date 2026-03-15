import { UserService } from "./service/user-service.js";

export function main() {
  const service = new UserService();
  return service.listUsers();
}

