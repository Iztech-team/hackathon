"""add leaderboard_frozen and leaderboard_snapshot to hackathon_settings

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-04-07 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('hackathon_settings')]
    with op.batch_alter_table('hackathon_settings') as batch_op:
        if 'leaderboard_frozen' not in cols:
            batch_op.add_column(
                sa.Column('leaderboard_frozen', sa.Boolean(), nullable=False, server_default=sa.false())
            )
        if 'leaderboard_snapshot' not in cols:
            batch_op.add_column(
                sa.Column('leaderboard_snapshot', sa.Text(), nullable=True)
            )


def downgrade() -> None:
    with op.batch_alter_table('hackathon_settings') as batch_op:
        batch_op.drop_column('leaderboard_snapshot')
        batch_op.drop_column('leaderboard_frozen')
