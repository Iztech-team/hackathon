"""add api_key to teams and api_keys_revealed to hackathon_settings

Revision ID: a1b2c3d4e5f6
Revises: 28ad6cb2e72f
Create Date: 2026-04-07 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '28ad6cb2e72f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add api_key column to teams table
    with op.batch_alter_table('teams') as batch_op:
        batch_op.add_column(sa.Column('api_key', sa.String(length=255), nullable=True))

    # Create hackathon_settings table if it doesn't exist yet
    # (it may already be created by init_db since it's a new table in the same release)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'hackathon_settings' not in inspector.get_table_names():
        op.create_table(
            'hackathon_settings',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('start_at', sa.DateTime(), nullable=False),
            sa.Column('end_at', sa.DateTime(), nullable=False),
            sa.Column('override', sa.String(length=16), nullable=True),
            sa.Column('api_keys_revealed', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )
    else:
        # Table exists — just add the new column if missing
        cols = [c['name'] for c in inspector.get_columns('hackathon_settings')]
        if 'api_keys_revealed' not in cols:
            with op.batch_alter_table('hackathon_settings') as batch_op:
                batch_op.add_column(
                    sa.Column('api_keys_revealed', sa.Boolean(), nullable=False, server_default=sa.false())
                )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('teams') as batch_op:
        batch_op.drop_column('api_key')

    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'hackathon_settings' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('hackathon_settings')]
        if 'api_keys_revealed' in cols:
            with op.batch_alter_table('hackathon_settings') as batch_op:
                batch_op.drop_column('api_keys_revealed')
