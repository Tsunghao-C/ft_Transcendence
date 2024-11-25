from django.db import models

class AppDatabaseRouter:
	def db_for_read(self, model, **hints):
		if model._meta.app_label == "user_service":
			return "user_db"
		return "default"
	
	def db_for_write(self, model, **hints):
		if model._meta.app_label == "user_service":
			return "user_db"
		return "default"
	
	def allow_migrate(self, db, app_label, model_name=None, **hints):
		if app_label == "user_service":
			return db == "user_db"
		return db == "default"