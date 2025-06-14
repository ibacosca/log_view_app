from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .logs.routes import router as logs_router

app = FastAPI()

# Set up CORS
origins = [
    "http://localhost:3000", # Next.js default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World!"}

app.include_router(logs_router)