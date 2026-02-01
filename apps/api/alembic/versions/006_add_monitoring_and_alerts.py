"""Add monitoring configs and alerts tables

Revision ID: 006_add_monitoring_and_alerts
Revises: 005_add_sites
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_monitoring_and_alerts'
down_revision = '005_add_sites'
branch_labels = None
depends_on = None


def upgrade():
    # Create monitoring_configs table
    op.create_table(
        'monitoring_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('frequency', sa.Enum('daily', 'weekly', 'monthly', name='monitoringfrequency'), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_monitoring_configs_id'), 'monitoring_configs', ['id'], unique=False)
    op.create_index(op.f('ix_monitoring_configs_site_id'), 'monitoring_configs', ['site_id'], unique=False)
    
    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('scan_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.Enum('score_drop', 'new_critical', 'new_high', name='alerttype'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['scan_id'], ['scans.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alerts_id'), 'alerts', ['id'], unique=False)
    op.create_index(op.f('ix_alerts_site_id'), 'alerts', ['site_id'], unique=False)
    op.create_index(op.f('ix_alerts_scan_id'), 'alerts', ['scan_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_alerts_scan_id'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_site_id'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_id'), table_name='alerts')
    op.drop_table('alerts')
    
    op.drop_index(op.f('ix_monitoring_configs_site_id'), table_name='monitoring_configs')
    op.drop_index(op.f('ix_monitoring_configs_id'), table_name='monitoring_configs')
    op.drop_table('monitoring_configs')

