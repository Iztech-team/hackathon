"""add hand_raised fields to teams

Revision ID: c9d0e1f2a3b4
Revises: b7c8d9e0f1a2
Create Date: 2026-04-09 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, Sequence[str], None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('teams')]
    with op.batch_alter_table('teams') as batch_op:
        if 'hand_raised' not in cols:
            batch_op.add_column(
                sa.Column('hand_raised', sa.Boolean(), nullable=False, server_default=sa.false())
            )
        if 'hand_raised_at' not in cols:
            batch_op.add_column(sa.Column('hand_raised_at', sa.DateTime(), nullable=True))
        if 'hand_raised_note' not in cols:
            batch_op.add_column(sa.Column('hand_raised_note', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('teams') as batch_op:
        batch_op.drop_column('hand_raised_note')
        batch_op.drop_column('hand_raised_at')
        batch_op.drop_column('hand_raised')
