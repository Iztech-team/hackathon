"""add invite_link and invite_link_revealed to hackathon_settings

Revision ID: h4c5d6e7f8g9
Revises: g3b4c5d6e7f8
Create Date: 2026-04-11 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'h4c5d6e7f8g9'
down_revision: Union[str, Sequence[str], None] = 'g3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('hackathon_settings')]
    with op.batch_alter_table('hackathon_settings') as batch_op:
        if 'invite_link' not in cols:
            batch_op.add_column(sa.Column('invite_link', sa.Text(), nullable=True))
        if 'invite_link_revealed' not in cols:
            batch_op.add_column(
                sa.Column('invite_link_revealed', sa.Boolean(), nullable=False, server_default=sa.false())
            )


def downgrade() -> None:
    with op.batch_alter_table('hackathon_settings') as batch_op:
        batch_op.drop_column('invite_link_revealed')
        batch_op.drop_column('invite_link')
