"""Add shared report links table

Revision ID: 004_add_shared_report_links
Revises: 003_add_brand_profiles
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_shared_report_links'
down_revision = '003_add_brand_profiles'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'shared_report_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('scan_id', sa.Integer(), nullable=False),
        sa.Column('token', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['scan_id'], ['scans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shared_report_links_id'), 'shared_report_links', ['id'], unique=False)
    op.create_index(op.f('ix_shared_report_links_scan_id'), 'shared_report_links', ['scan_id'], unique=False)
    op.create_index(op.f('ix_shared_report_links_token'), 'shared_report_links', ['token'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_shared_report_links_token'), table_name='shared_report_links')
    op.drop_index(op.f('ix_shared_report_links_scan_id'), table_name='shared_report_links')
    op.drop_index(op.f('ix_shared_report_links_id'), table_name='shared_report_links')
    op.drop_table('shared_report_links')

