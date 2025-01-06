"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 5.1.3.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
from datetime import timedelta
import os
from vault_helper import vault_client

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = 'https://localhost:8443/media/'

# Initialize and get credentials from Vault
db_credentials = vault_client.get_database_credentials("database")
jwt_credentials = vault_client.get_database_credentials("jwt")
email_credentials = vault_client.get_database_credentials("email")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = jwt_credentials['JWT_SECRET_KEY']

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = bool(os.environ.get("DEBUG", default=0))
# DEBUG = 1

#ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS").split(" ")
ALLOWED_HOSTS = [
	 "*"
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30), # token refreshes every 30 mins
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1), # a new token is needed (by logging in) each day
}

# Application definition

INSTALLED_APPS = [
	"django_crontab",
    "daphne",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	"user_service",
	"game_service",
	"rest_framework",
	"corsheaders",
	"match_making",
    "chat",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
	"corsheaders.middleware.CorsMiddleware",
    "user_service.middleware.LogRequestMiddleware",
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            # only absolute paths here
            BASE_DIR / 'game_service' / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": db_credentials['POSTGRES_ENGINE'],
        "NAME": db_credentials['POSTGRES_DB'],
        "USER": db_credentials['POSTGRES_USER'],
        "PASSWORD": db_credentials['POSTGRES_PASS'],
        "HOST": db_credentials['POSTGRES_HOST'],
        "PORT": os.environ.get("POSTGRES_PORT", "5434"),
    },
}

# DATABASE_ROUTERS = ['backend.database_router.AppDatabaseRouter']


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTH_USER_MODEL = 'user_service.CustomUser'

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = '/app/static'
STATICFILES_DIRS = [
    './'
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# will need to change this when we get a url
#CORS_ALLOWED_ORIGINS = os.environ.get("DJANGO_ALLOWED_HOSTS").split(" ")
#CORS_ALLOWED_ORIGINS = [
#	"http://localhost:8000",
#	"http://127.0.0.1:8000",
#	"http://0.0.0.0:8000"
#]
#CORS_ALLOWS_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True

# can replace inmemorychannellayer with redis later
CHANNEL_LAYERS = {
   "default": {
       "BACKEND": "channels_redis.core.RedisChannelLayer",
       "CONFIG": {
           "hosts": [('redis', 6379)]
       },
   },
}

LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {message}',
                'style': '{',
            },
            'simple': {
                'format': '{levelname} {message}',
                'style': '{',
            },
        },
        'handlers': {
            "console": {
                "class": "logging.StreamHandler",
                "level": "ERROR",
            },
            "gamerooms_file": {
                "level": "DEBUG",
                "class": "logging.FileHandler",
                "filename": "/root/logs/gamerooms.log",
                "formatter": "verbose",
            }, 
            "gameconsumers_file": {
                "level": "DEBUG",
                "class": "logging.FileHandler",
                "filename": "/root/logs/gameconsumers.log",
                "formatter": "verbose",
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'ERROR',  # Set to DEBUG for detailed logs
        },
        'loggers': {
            'gamerooms': {
                'handlers': ['gamerooms_file'],
                'level': 'DEBUG',
                'propagate': True,
            },
            'gameconsumers': {
                'handlers': ['gameconsumers_file'],
                'level': 'DEBUG',
                'propagate': True,
            },
        },
}

# Alex add for Email host setup
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = email_credentials['EMAIL_HOST_USER']
EMAIL_HOST_PASSWORD = email_credentials['EMAIL_HOST_PASS'] # Env

LDB_UPDATE_TIMER = os.environ.get("LDB_UPDATE_TIMER", 15)
CRONJOBS = [
    (f'*/{LDB_UPDATE_TIMER} * * * *', 'game_service.tasks.update_leaderboard', '>> /var/log/cron.log 2>&1'),
	# ('*/1 * * * *', 'match_making.tasks.monitor_players'),
]

DATETIME_FORMAT = 'd-m-Y H:i:s'
