import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    print(f"DEBUG: Comparing plain text: {plain_password} == {hashed_password}")
    return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    return password

def create_access_token(subject: str, role: str, tenant_id: int, user_id: int, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store essential basic info in JWT claims to reduce DB queries
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": tenant_id,
        "user_id": user_id
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
