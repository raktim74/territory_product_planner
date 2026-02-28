from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.hierarchy import router as hierarchy_router
from app.api.v1.territory import router as territory_router
from app.api.v1.product import router as product_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(hierarchy_router, prefix="/hierarchy", tags=["hierarchy"])
api_router.include_router(territory_router, prefix="/territory", tags=["territory"])
api_router.include_router(product_router, prefix="/product", tags=["product"])

@api_router.get("/healthz")
async def health_check():
    return {"status": "ok", "message": "Territory Management SaaS Running"}
