"""add platform_fee_rate to auction

Revision ID: 3f4e5d6c7b8a
Revises: 2d08de55e3c9
Create Date: 2025-12-03 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3f4e5d6c7b8a'
down_revision = '2d08de55e3c9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('auction', sa.Column('platform_fee_rate', sa.Float(), nullable=False, server_default='0.0'))


def downgrade():
    op.drop_column('auction', 'platform_fee_rate')
