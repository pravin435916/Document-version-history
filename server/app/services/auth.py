from bson.errors import InvalidId

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class UserAlreadyExistsError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def register_user(self, username: str, password: str) -> User:
        normalized_username = username.strip().lower()
        existing = self.user_repository.find_by_username(normalized_username)
        if existing:
            raise UserAlreadyExistsError("Username already exists")

        password_hash = get_password_hash(password)
        return self.user_repository.create_user(normalized_username, password_hash)

    def login(self, username: str, password: str) -> str:
        normalized_username = username.strip().lower()
        user = self.user_repository.find_by_username(normalized_username)
        if not user or not verify_password(password, user["password_hash"]):
            raise InvalidCredentialsError("Invalid username or password")

        return create_access_token(str(user["_id"]))

    def get_user_by_id(self, user_id: str):
        try:
            user = self.user_repository.find_by_id(user_id)
        except (InvalidId, TypeError):
            return None
        return user
