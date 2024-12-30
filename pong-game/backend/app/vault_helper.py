import hvac
import os
from functools import lru_cache

class VaultClient:
    """
    This class handles authentication and retrieval of secrets in vault
    while using caching to imporve performance.
    """
    _instance = None
    _initialized = False
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        # only initialize once
        if not self._initialized:
            try:
                with open(os.environ['VAULT_TOKEN_FILE']) as f:
                    token = f.read().strip()
                # Initialize connection to Vault
                self._client = hvac.Client(
                    url=os.environ['VAULT_ADDR'],
                    token=token,
                    verify=os.environ['VAULT_CACERT']
                )
                if self._client.is_authenticated():
                    print("Successfully authenticated with Vault")
                else:
                    print("Failed to authenticate with Vault")
            except Exception as e:
                print(f"Error initializing Vault client: {e}")
                raise
            self._initialized = True
    @property
    def client(self):
        return self._client

    @lru_cache(maxsize=None)
    def get_database_credentials(self, cre_type):
        """
        Retrieve database credentials from vault
        The @lru_cache decorator helps prevent too man calls to Vault by cahching the result
        """
        try:
            response = self.client.secrets.kv.v2.read_secret_version(
                path='pong-game/' + cre_type,
                mount_point='secret'
            )
            # print(f"Get response from vault: {response}")
            return response['data']
        except Exception as e:
            print(f"Failed to read from Vault:  {e}")
            return ""

# Create a single instance to be used throughout the application
vault_client = VaultClient()