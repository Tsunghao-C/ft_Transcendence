from flask import Flask, request, jsonify
import pyotp
import hvac
from prometheus_client import Counter, start_http_server
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Prometheus metrics
VERIFICATION_COUNTER = Counter('twofa_verification_total', 'Total 2FA verification attempts', ['status'])
SETUP_COUNTER = Counter('twofa_setup_total', 'Total 2FA setup attempts', ['status'])

# Vault client setup
vault_client = hvac.Client(
    url=os.getenv('VAULT_ADDR', 'http://vault:8200'),
    token=os.getenv('VAULT_TOKEN', 'dev-token-123')
)

def get_user_secret(user_id: str) -> str:
    """Get user's 2FA secret from Vault"""
    try:
        secret_path = f'secret/2fa/{user_id}'
        secret = vault_client.read(secret_path)
        if secret and 'data' in secret and 'totp_secret' in secret['data']:
            return secret['data']['totp_secret']
    except Exception as e:
        logger.error(f"Error reading from Vault: {e}")
    return None

def store_user_secret(user_id: str, totp_secret: str) -> bool:
    """Store user's 2FA secret in Vault"""
    try:
        secret_path = f'secret/2fa/{user_id}'
        vault_client.write(secret_path, totp_secret=totp_secret)
        return True
    except Exception as e:
        logger.error(f"Error writing to Vault: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/setup', methods=['POST'])
def setup_2fa():
    """Setup 2FA for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            SETUP_COUNTER.labels(status='error').inc()
            return jsonify({'error': 'user_id is required'}), 400

        # Generate new TOTP secret
        secret = pyotp.random_base32()
        
        # Store in Vault
        if store_user_secret(user_id, secret):
            # Generate QR code URL
            totp = pyotp.TOTP(secret)
            provisioning_uri = totp.provisioning_uri(
                name=user_id,
                issuer_name="Pong Game"
            )
            
            SETUP_COUNTER.labels(status='success').inc()
            return jsonify({
                'secret': secret,
                'qr_uri': provisioning_uri
            }), 201
        else:
            SETUP_COUNTER.labels(status='error').inc()
            return jsonify({'error': 'Failed to store 2FA secret'}), 500

    except Exception as e:
        logger.error(f"Error in setup_2fa: {e}")
        SETUP_COUNTER.labels(status='error').inc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/verify', methods=['POST'])
def verify_2fa():
    """Verify 2FA token"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        token = data.get('token')

        if not user_id or not token:
            VERIFICATION_COUNTER.labels(status='error').inc()
            return jsonify({'error': 'user_id and token are required'}), 400

        # Get secret from Vault
        secret = get_user_secret(user_id)
        if not secret:
            VERIFICATION_COUNTER.labels(status='error').inc()
            return jsonify({'error': 'User not found or 2FA not setup'}), 404

        # Verify token
        totp = pyotp.TOTP(secret)
        if totp.verify(token):
            VERIFICATION_COUNTER.labels(status='success').inc()
            return jsonify({'valid': True}), 200
        else:
            VERIFICATION_COUNTER.labels(status='invalid').inc()
            return jsonify({'valid': False}), 401

    except Exception as e:
        logger.error(f"Error in verify_2fa: {e}")
        VERIFICATION_COUNTER.labels(status='error').inc()
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Start Prometheus metrics server on port 9090
    start_http_server(9090)
    
    # Start Flask app
    port = int(os.getenv('PORT', 8082))
    app.run(host='0.0.0.0', port=port)