from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from .service import LogService

router = APIRouter()
log_service = LogService()

@router.get("/logs")
async def list_logs():
    """
    Endpoint to list all available log files.
    """
    return log_service.list_logs()

@router.get("/logs/{filename}")
async def read_log(filename: str, start_line: int = 1, num_lines: int = 100):
    """
    Endpoint to read a log file starting from a specific line number.
    
    Args:
        filename: Name of the log file to read
        start_line: Line number to start reading from (1-based)
        num_lines: Number of lines to read
    """
    try:
        return StreamingResponse(
            log_service.read_log_chunks(filename, start_line, num_lines),
            media_type="text/plain"
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) 