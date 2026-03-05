from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, questions, interview, resume, dashboard, admin

app = FastAPI(
    title="CrackIt API",
    description="AI-Based Intelligent Interview Preparation and Evaluation System",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(interview.router)
app.include_router(resume.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "name": "CrackIt API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
