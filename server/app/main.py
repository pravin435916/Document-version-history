# write main.py
from fastapi import FastAPI
from app.routes.document_route import router as document_router
app = FastAPI(title="Document Version History API")
from fastapi.middleware.cors import CORSMiddleware
import logging
# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

#cors 
app.add_middleware(
CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(document_router)