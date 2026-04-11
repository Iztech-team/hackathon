"""add volunteers table and arrived flag on teams

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-04-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd0e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Create volunteers table
    if 'volunteers' not in inspector.get_table_names():
        op.create_table(
            'volunteers',
            sa.Column('id', sa.CHAR(36), primary_key=True),
            sa.Column('user_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
            sa.Column('name', sa.String(100), nullable=False),
        )

    # Add arrived columns to teams
    cols = [c['name'] for c in inspector.get_columns('teams')]
    with op.batch_alter_table('teams') as batch_op:
        if 'arrived' not in cols:
            batch_op.add_column(
                sa.Column('arrived', sa.Boolean(), nullable=False, server_default=sa.false())
            )
        if 'arrived_at' not in cols:
            batch_op.add_column(sa.Column('arrived_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('teams') as batch_op:
        batch_op.drop_column('arrived_at')
        batch_op.drop_column('arrived')
    op.drop_table('volunteers')
