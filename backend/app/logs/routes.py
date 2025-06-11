from fastapi import APIRouter
from .service import LogService

router = APIRouter()
log_service = LogService()

@router.get("/logs")
async def list_logs():
    """
    Endpoint to list all available log files.
    """
    return log_service.list_logs() 