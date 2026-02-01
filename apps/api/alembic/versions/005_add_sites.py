"""Add sites table and site_id to scans

Revision ID: 005_add_sites
Revises: 004_add_shared_report_links
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_sites'
down_revision = '004_add_shared_report_links'
branch_labels = None
depends_on = None


def upgrade():
    # Create sites table
    op.create_table(
        'sites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('domain', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sites_id'), 'sites', ['id'], unique=False)
    op.create_index(op.f('ix_sites_domain'), 'sites', ['domain'], unique=True)
    
    # Add site_id to scans table
    op.add_column('scans', sa.Column('site_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_scans_site_id', 'scans', 'sites', ['site_id'], ['id'])
    op.create_index(op.f('ix_scans_site_id'), 'scans', ['site_id'], unique=False)


def downgrade():
    # Remove site_id from scans
    op.drop_index(op.f('ix_scans_site_id'), table_name='scans')
    op.drop_constraint('fk_scans_site_id', 'scans', type_='foreignkey')
    op.drop_column('scans', 'site_id')
    
    # Drop sites table
    op.drop_index(op.f('ix_sites_domain'), table_name='sites')
    op.drop_index(op.f('ix_sites_id'), table_name='sites')
    op.drop_table('sites')

