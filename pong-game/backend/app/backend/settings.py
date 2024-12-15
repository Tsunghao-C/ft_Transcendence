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


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = 'https://localhost:8443/media/'


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY")
# SECRET_KEY = "wowow321"

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
        "ENGINE": os.environ.get("POSTGRES_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.environ.get("POSTGRES_DB", BASE_DIR / "db.sqlite3"),
        "USER": os.environ.get("POSTGRES_USER", "transc_user"),
        "PASSWORD": os.environ.get("POSTGRES_PASS", "transc_pass"),
        "HOST": os.environ.get("POSTGRES_HOST", "transc_host"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
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
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Set to DEBUG for detailed logs
        },
        'loggers': {
            # 'django': {
            #     'handlers': ['console'],
            #     'level': 'DEBUG',
            #     'propagate': False,
            # },
            'django.channels': {
                'handlers': ['console'],
                'level': 'DEBUG',  # Log WebSocket-related events
                'propagate': False,
            },
            'channels': {
                'handlers': ['console'],
                'level': 'DEBUG',
            }
        }
}

# Alex add for Email host setup
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = '42transcendental@gmail.com'
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD") # Env

LDB_UPDATE_TIMER = os.environ.get("LDB_UPDATE_TIMER", 15)
CRONJOBS = [
    (f'*/{LDB_UPDATE_TIMER} * * * *', 'game_service.tasks.update_leaderboard')
]

DATETIME_FORMAT = 'd-m-Y H:i:s'
