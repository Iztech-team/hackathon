from fastapi import APIRouter
from app.api.routes import auth, teams, scores, leaderboard, judges, admin, hackathon

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(scores.router, prefix="/scores", tags=["scores"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
api_router.include_router(judges.router, prefix="/judges", tags=["judges"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(hackathon.router, prefix="/hackathon", tags=["hackathon"])
