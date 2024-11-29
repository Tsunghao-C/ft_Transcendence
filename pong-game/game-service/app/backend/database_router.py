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