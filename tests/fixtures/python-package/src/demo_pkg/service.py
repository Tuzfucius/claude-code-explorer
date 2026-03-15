class UserService:
    def load_users(self) -> list[str]:
        return ["Ada", "Grace"]


def load_users() -> list[str]:
    return UserService().load_users()

