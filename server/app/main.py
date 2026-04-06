# write main.py
from fastapi import FastAPI
from app.routes.document_route import router as document_router
app = FastAPI(title="Document Version History API")
from fastapi.middleware.cors import CORSMiddleware

#cors 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(document_router)