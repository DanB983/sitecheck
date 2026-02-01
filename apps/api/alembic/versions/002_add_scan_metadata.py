"""Add scan metadata fields

Revision ID: 002_scan_metadata
Revises: 001_initial
Create Date: 2024-02-01 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_scan_metadata'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to scans table
    # Use JSON for Postgres, Text for SQLite (for compatibility)
    op.add_column('scans', sa.Column('normalized_url', sa.String(), nullable=True))
    op.add_column('scans', sa.Column('final_url', sa.String(), nullable=True))
    
    # Try to use JSON for Postgres, fallback to Text for SQLite
    try:
        op.add_column('scans', sa.Column('redirect_chain', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    except:
        # SQLite doesn't support JSON natively, use Text
        op.add_column('scans', sa.Column('redirect_chain', sa.Text(), nullable=True))
    
    op.add_column('scans', sa.Column('response_status', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('scans', 'response_status')
    op.drop_column('scans', 'redirect_chain')
    op.drop_column('scans', 'final_url')
    op.drop_column('scans', 'normalized_url')

