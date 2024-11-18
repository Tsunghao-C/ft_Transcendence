from flask import Flask
from prometheus_client import Counter

# Initialize Flask application
app = Flask(__name__)

# Initialize Prometheus metrics
VERIFICATION_COUNTER = Counter('twofa_verification_total', 'Total 2FA verification attempts', ['status'])
SETUP_COUNTER = Counter('twofa_setup_total', 'Total 2FA setup attempts', ['status'])

# Import routes after app initialization to avoid circular imports
from . import app