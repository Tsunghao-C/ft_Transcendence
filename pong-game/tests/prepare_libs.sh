#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Setting up test libraries in $SCRIPT_DIR/lib..."

# Create lib directory
mkdir -p "$SCRIPT_DIR/lib"
cd "$SCRIPT_DIR/lib"

# Create a temporary virtual environment
python3 -m venv temp_env
source temp_env/bin/activate

# Install compatible websockets version
echo "Installing websockets 10.4..."
pip install websockets==10.4 -t .

# Clean up
deactivate
rm -rf temp_env
rm -rf *.dist-info __pycache__

echo -e "${GREEN}Test libraries setup complete${NC}"