"""make project_name nullable

Revision ID: 28ad6cb2e72f
Revises: 8f4ca85a73fe
Create Date: 2026-04-07 09:55:23.616380

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '28ad6cb2e72f'
down_revision: Union[str, Sequence[str], None] = '8f4ca85a73fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # SQLite doesn't support ALTER COLUMN, use batch mode
    with op.batch_alter_table('teams') as batch_op:
        batch_op.alter_column('project_name',
                   existing_type=sa.VARCHAR(length=200),
                   nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('teams') as batch_op:
        batch_op.alter_column('project_name',
                   existing_type=sa.VARCHAR(length=200),
                   nullable=False)
