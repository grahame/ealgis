"""
Django settings for ealgis project.

Generated by 'django-admin startproject' using Django 1.10.4.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os
from .util import get_env, get_version

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_env("SECRET_KEY")

# Security
# Causes an infite redirect loop...but works fine on Scremsong. Gotta work out why.
# SECURE_SSL_REDIRECT = True
# https://stackoverflow.com/a/22284717
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
CORS_ALLOW_CREDENTIALS = True


if get_env("ENVIRONMENT") == "PRODUCTION":
    DEBUG = False
    CONN_MAX_AGE = 100  # Should be half our max number of PostgreSQL connections
    CORS_ORIGIN_WHITELIST = (
        get_env("CORS_DOMAIN"),
    )
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
            },
        },
        'handlers': {
            'file': {
                'level': 'DEBUG',
                'class': 'logging.FileHandler',
                'filename': '/var/log/django.log',
                'formatter': 'verbose',
            },
        },
        'loggers': {
            'django': {
                'handlers': ['file'],
                'level': 'DEBUG',
                'propagate': True,
            },
        },
    }
    ALLOWED_HOSTS = ["localhost", get_env("CORS_DOMAIN")]
    STATIC_ROOT = "/build/static"

    RAVEN_CONFIG = {
        "dsn": get_env("RAVEN_URL"),
        "environment": get_env("ENVIRONMENT"),
        "site": get_env("EALGIS_SITE_NAME"),
        "release": get_version(),
    }
    TEMPLATES_DIRS = []
else:
    DEBUG = True
    CORS_ORIGIN_WHITELIST = (
        'localhost',
    )
    ALLOWED_HOSTS = ["localhost"]
    STATICFILES_DIRS = [
        '/frontend/dist/',
    ]
    TEMPLATES_DIRS = ["/frontend/dist/"]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'social_django',
    'ealgis.ealauth',
    'rest_framework',
    'ealgis.ealfront',
    'raven.contrib.django.raven_compat',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTH_BACKENDS = [

]

if get_env('SOCIAL_AUTH_MICROSOFT_GRAPH_KEY') is not None:
    AUTH_BACKENDS.append("social_core.backends.microsoft.MicrosoftOAuth2")
    SOCIAL_AUTH_MICROSOFT_GRAPH_KEY = get_env('SOCIAL_AUTH_MICROSOFT_GRAPH_KEY')
    SOCIAL_AUTH_MICROSOFT_GRAPH_SECRET = get_env('SOCIAL_AUTH_MICROSOFT_GRAPH_SECRET')

if get_env('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY') is not None:
    AUTH_BACKENDS.append("social_core.backends.google.GoogleOAuth2")
    SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = get_env('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY')
    SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = get_env('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET')

if get_env('SOCIAL_AUTH_FACEBOOK_KEY') is not None:
    AUTH_BACKENDS.append("social_core.backends.facebook.FacebookOAuth2")
    SOCIAL_AUTH_FACEBOOK_KEY = get_env('SOCIAL_AUTH_FACEBOOK_KEY')
    SOCIAL_AUTH_FACEBOOK_SECRET = get_env('SOCIAL_AUTH_FACEBOOK_SECRET')

if get_env('SOCIAL_AUTH_TWITTER_KEY') is not None:
    AUTH_BACKENDS.append("social_core.backends.twitter.TwitterOAuth")
    SOCIAL_AUTH_TWITTER_KEY = get_env('SOCIAL_AUTH_TWITTER_KEY')
    SOCIAL_AUTH_TWITTER_SECRET = get_env('SOCIAL_AUTH_TWITTER_SECRET')

if os.path.isfile("ealgis/ealauth/backends.py"):
    AUTH_BACKENDS.append("ealgis.ealauth.backends.CustomOAuth2")
    CUSTOM_OAUTH2_BACKEND = True

AUTH_BACKENDS.append("django.contrib.auth.backends.ModelBackend")
AUTHENTICATION_BACKENDS = tuple(AUTH_BACKENDS)
del AUTH_BACKENDS

# SOCIAL_AUTH_PIPELINE = (
#     'social_core.pipeline.social_auth.social_details',
#     'social_core.pipeline.social_auth.social_uid',
#     'social_core.pipeline.social_auth.auth_allowed',
#     'social_core.pipeline.social_auth.social_user',
#     'social_core.pipeline.user.get_username',
#     'social_core.pipeline.user.create_user',
#     # 'ealgis.ealauth.pipeline.do_something',
#     'social_core.pipeline.social_auth.associate_user',
#     'social_core.pipeline.social_auth.load_extra_data',
#     'social_core.pipeline.user.user_details',
# )

ROOT_URLCONF = 'ealgis.urls'

LOGIN_REDIRECT_URL = get_env("EALGIS_BASE_URL")
SOCIAL_AUTH_REDIRECT_IS_HTTPS = True

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': TEMPLATES_DIRS,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = 'ealgis.wsgi.application'

CACHES = {
    'default': {
        'BACKEND': 'redis_lock.django_cache.RedisCache',
        'LOCATION': get_env('REDIS_LOCATION'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient'
        }
    }
}


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        # 'OPTIONS': {
        #     'options': '-c search_path={}'.format(get_env('DB_SCHEMA'))
        # },
        'NAME': get_env('DB_NAME'),
        'USER': get_env('DB_USERNAME'),
        'PASSWORD': get_env('DB_PASSWORD'),
        'HOST': get_env('DB_HOST'),
        'PORT': get_env('DB_PORT'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-au'

TIME_ZONE = 'Australia/Perth'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_URL = '/static/'
