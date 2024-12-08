from django.db import models

class AppDatabaseRouter:
    def db_for_read(self, model, **hints):
        if model._meta.app_label in ['auth', 'admin', 'contenttypes', 'sessions', 'user_service']:
            return 'default'  # Default points to user_db
        if model._meta.app_label == 'game_service':
            return 'game_db'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label in ['auth', 'admin', 'contenttypes', 'sessions', 'user_service']:
            return 'default'
        if model._meta.app_label == 'game_service':
            return 'game_db'
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in ['auth', 'admin', 'contenttypes', 'sessions', 'user_service']:
            return db == 'default'
        if app_label == 'game_service':
            return db == 'game_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        db1 = obj1._state.db
        db2 = obj2._state.db
        if db1 == db2:
            return True
        if {db1, db2} == {'default', 'game_db'}:
            return True
        return None