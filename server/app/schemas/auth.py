from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def _validate_bcrypt_password_length(value: str) -> str:
    # Bcrypt only supports up to 72 bytes.
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    return value


class RegisterUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)

    _password_bytes = field_validator("password")(_validate_bcrypt_password_length)


class LoginRequest(BaseModel):
    username: str
    password: str

    _password_bytes = field_validator("password")(_validate_bcrypt_password_length)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    created_at: datetime
