"""add registration_open flag to hackathon_settings

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-04-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd0e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('hackathon_settings')]
    with op.batch_alter_table('hackathon_settings') as batch_op:
        if 'registration_open' not in cols:
            batch_op.add_column(
                sa.Column('registration_open', sa.Boolean(), nullable=False, server_default=sa.true())
            )


def downgrade() -> None:
    with op.batch_alter_table('hackathon_settings') as batch_op:
        batch_op.drop_column('registration_open')
