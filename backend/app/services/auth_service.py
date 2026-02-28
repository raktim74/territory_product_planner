from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.domain.auth.repository import UserRepository, TenantRepository, RoleRepository
from app.domain.auth.schemas import UserCreate, UserLogin, TenantCreate
from app.core.security import verify_password, create_access_token

class AuthService:
    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)
        self.tenant_repo = TenantRepository(session)
        self.role_repo = RoleRepository(session)

    async def authenticate_user(self, login_data: UserLogin) -> str:
        # Check user
        user = await self.user_repo.get_by_email(email=login_data.email)
        
        if not user:
            print(f"DEBUG: Login failed. User {login_data.email} not found in DB.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
            
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
            
        # Verify password
        is_verified = verify_password(login_data.password, user.hashed_password)
        print(f"DEBUG: Login for {login_data.email}. Input password: '{login_data.password}'. DB password: '{user.hashed_password}'. Match: {is_verified}")
        
        if not is_verified:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        # Get role name for JWT claims
        role = await self.role_repo.get_by_id(user.role_id)
        role_name = role.name.value if role else "USER" # Default to uppercase USER

        # Create token
        return create_access_token(
            subject=user.email,
            role=role_name,
            tenant_id=user.tenant_id,
            user_id=user.id
        )

    async def register_user(self, user_in: UserCreate):
        existing_user = await self.user_repo.get_by_email(email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
            
        created_user = await self.user_repo.create(user_in)
        return created_user

    async def register_tenant(self, tenant_in: TenantCreate):
        existing_tenant = await self.tenant_repo.get_by_name(name=tenant_in.name)
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A tenant with this name already exists."
            )
            
        created_tenant = await self.tenant_repo.create(tenant_in)
        return created_tenant

    async def get_all_users(self, tenant_id: int):
        return await self.user_repo.get_multi_by_tenant(tenant_id)

    async def get_user_by_id(self, user_id: int):
        return await self.user_repo.get_by_id(user_id)
