from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import import_api, reconciliation_api, invoices_api, settlements_api, login, company, auctions, users, actors

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    with open("backend_error.log", "a") as f:
        f.write(f"Global error: {str(exc)}\n")
        f.write(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error"},
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    print(f"Headers: {request.headers}")
    try:
        response = await call_next(request)
        print(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        print(f"Request failed: {str(e)}")
        raise e

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(login.router, prefix=f"{settings.API_V1_STR}", tags=["login"])
app.include_router(import_api.router, prefix=f"{settings.API_V1_STR}/import", tags=["import"])
app.include_router(reconciliation_api.router, prefix=f"{settings.API_V1_STR}/reconciliation", tags=["reconciliation"])
app.include_router(invoices_api.router, prefix=f"{settings.API_V1_STR}/invoices", tags=["invoices"])
app.include_router(settlements_api.router, prefix=f"{settings.API_V1_STR}/settlements", tags=["settlements"])
app.include_router(company.router, prefix=f"{settings.API_V1_STR}/company", tags=["company"])
app.include_router(auctions.router, prefix=f"{settings.API_V1_STR}/auctions", tags=["auctions"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(actors.router, prefix=f"{settings.API_V1_STR}/actors", tags=["actors"])

@app.get("/")
async def root():
    return {"message": "Bienvenue sur Auctify API"}
