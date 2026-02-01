"""Add brand profiles table

Revision ID: 003_add_brand_profiles
Revises: 002_add_scan_metadata
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_brand_profiles'
down_revision = '002_add_scan_metadata'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'brand_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('logo_base64', sa.Text(), nullable=True),
        sa.Column('primary_color', sa.String(), nullable=False, server_default='#2563eb'),
        sa.Column('accent_color', sa.String(), nullable=False, server_default='#10b981'),
        sa.Column('footer_text', sa.Text(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_brand_profiles_id'), 'brand_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_brand_profiles_name'), 'brand_profiles', ['name'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_brand_profiles_name'), table_name='brand_profiles')
    op.drop_index(op.f('ix_brand_profiles_id'), table_name='brand_profiles')
    op.drop_table('brand_profiles')

