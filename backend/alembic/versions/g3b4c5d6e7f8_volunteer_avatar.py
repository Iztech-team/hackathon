"""add avatar_seed to volunteers

Revision ID: g3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2026-04-11 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('volunteers')]
    with op.batch_alter_table('volunteers') as batch_op:
        if 'avatar_seed' not in cols:
            batch_op.add_column(sa.Column('avatar_seed', sa.String(100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('volunteers') as batch_op:
        batch_op.drop_column('avatar_seed')
