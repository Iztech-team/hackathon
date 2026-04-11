"""add email column to team_members

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-04-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('team_members')]
    with op.batch_alter_table('team_members') as batch_op:
        if 'email' not in cols:
            batch_op.add_column(sa.Column('email', sa.String(255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('team_members') as batch_op:
        batch_op.drop_column('email')
