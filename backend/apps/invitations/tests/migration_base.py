"""Run a data migration against rows created at the previous schema."""
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class MigrationTestCase(TransactionTestCase):
    app = 'invitations'
    migrate_from = None   # e.g. '0029_invitation_photo_filter'
    migrate_to = None     # e.g. '0030_copy_variant_scripture_gift_moderation'

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate([(self.app, self.migrate_from)])
        self.old_apps = executor.loader.project_state([(self.app, self.migrate_from)]).apps
        self.setUpBeforeMigration(self.old_apps)
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate([(self.app, self.migrate_to)])
        self.apps = executor.loader.project_state([(self.app, self.migrate_to)]).apps

    def tearDown(self):
        # Leave the test database at the latest schema for the next test.
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())

    def setUpBeforeMigration(self, apps):
        pass

    def make_old_invitation(self, apps, slug='lama', **kw):
        from datetime import date
        Invitation = apps.get_model('invitations', 'Invitation')
        return Invitation.objects.create(slug=slug, wedding_date=date(2026, 12, 12), expires_at=date(2027, 3, 12), **kw)
