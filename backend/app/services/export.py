import csv
import io
from typing import List
from app.models import Team, Judge


def export_teams_to_csv(teams: List[Team]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Team ID", "Team Name", "Project Name", "Description",
        "Members", "Innovation", "Visual Design", "Architecture", "Readiness",
        "Total Score", "Created At"
    ])

    for team in teams:
        # Get scores dict
        scores = {s.category_id: s.points for s in team.scores}
        total = sum(scores.values())
        members = ", ".join([m.name for m in team.members])

        writer.writerow([
            team.id,
            team.team_name,
            team.project_name,
            team.description or "",
            members,
            scores.get("innovation", 0),
            scores.get("visual_design", 0),
            scores.get("architecture", 0),
            scores.get("readiness", 0),
            total,
            team.created_at.isoformat() if team.created_at else "",
        ])

    return output.getvalue()


def export_judges_to_csv(judges: List[Judge]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Judge ID", "Name", "Category", "Username"])

    for judge in judges:
        writer.writerow([
            judge.id,
            judge.name,
            judge.category_id,
            judge.user.username if judge.user else "",
        ])

    return output.getvalue()


def export_rankings_to_csv(teams: List[Team]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Rank", "Team Name", "Project Name",
        "Innovation", "Visual Design", "Architecture", "Readiness", "Total"
    ])

    # Sort by total score
    def get_total(team):
        return sum(s.points for s in team.scores)

    sorted_teams = sorted(teams, key=get_total, reverse=True)

    for rank, team in enumerate(sorted_teams, 1):
        scores = {s.category_id: s.points for s in team.scores}
        total = sum(scores.values())

        writer.writerow([
            rank,
            team.team_name,
            team.project_name,
            scores.get("innovation", 0),
            scores.get("visual_design", 0),
            scores.get("architecture", 0),
            scores.get("readiness", 0),
            total,
        ])

    return output.getvalue()
