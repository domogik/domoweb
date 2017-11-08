"""Add widget min-max size

Revision ID: 1229b91427b8
Revises: 271a75be297d
Create Date: 2017-10-31 10:25:36.117909

"""

# revision identifiers, used by Alembic.
revision = '1229b91427b8'
down_revision = '271a75be297d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('widget', sa.Column('min_height', sa.Integer(), nullable=True))
    op.add_column('widget', sa.Column('min_width', sa.Integer(), nullable=True))
    op.add_column('widget', sa.Column('max_height', sa.Integer(), nullable=True))
    op.add_column('widget', sa.Column('max_width', sa.Integer(), nullable=True))

    op.add_column('widgetInstance', sa.Column('height', sa.Integer(), nullable=True))
    op.add_column('widgetInstance', sa.Column('width', sa.Integer(), nullable=True))

def downgrade():
    op.drop_column('widget', 'min_height')
    op.drop_column('widget', 'min_width')
    op.drop_column('widget', 'max_height')
    op.drop_column('widget', 'max_width')

    op.drop_column('widgetInstance', 'height')
    op.drop_column('widgetInstance', 'width')

