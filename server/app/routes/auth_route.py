from fastapi import APIRouter, HTTPException, status

from app.core.db import db
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterUserRequest, TokenResponse, UserResponse
from app.services.auth import AuthService, InvalidCredentialsError, UserAlreadyExistsError

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_user_response(user) -> UserResponse:
    return UserResponse(id=str(user.id), username=user.username, created_at=user.created_at)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterUserRequest):
    auth_service = AuthService(UserRepository(db))
    try:
        user = auth_service.register_user(payload.username, payload.password)
        return _to_user_response(user)
    except UserAlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    auth_service = AuthService(UserRepository(db))
    try:
        token = auth_service.login(payload.username, payload.password)
        return TokenResponse(access_token=token)
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
