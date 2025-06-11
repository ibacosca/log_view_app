from fastapi import FastAPI
from .logs.routes import router as logs_router

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World!"}

app.include_router(logs_router)