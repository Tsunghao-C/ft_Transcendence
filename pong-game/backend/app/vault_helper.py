import hvac
import os
from functools import lru_cache

class VaultClient:
    """
    This class handles authentication and retrieval of secrets in vault
    while using caching to imporve performance.
    """
    def __init__(self):
        with open(os.environ['VAULT_TOKEN_FILE']) as f:
            token = f.read().strip()
        # Initialize connection to Vault
        self.client = hvac.Client(
            url=os.environ['VAULT_ADDR'],
            token=token,
            verify=os.environ['VAULT_CACERT']
        )
        if self.client.is_authenticated():
            print("Successfully authenticated with Vault")
        else:
            print("Failed to authenticate with Vault")

    @lru_cache(maxsize=1)
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