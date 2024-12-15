#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ensure lib directory exists
if [ ! -d "$SCRIPT_DIR/lib" ]; then
    echo "Setting up test libraries..."
    bash "$SCRIPT_DIR/prepare_libs.sh"
fi

# Function to check WebSocket connection
check_websocket() {
    local endpoint=$1
    local timeout=$2
    local socket_type=$3
    local max_retries=3
    local retry_count=0
    local retry_delay=5

    while [ $retry_count -lt $max_retries ]; do
        echo "Checking WebSocket endpoint: $endpoint (Attempt $((retry_count + 1))/$max_retries)"
    
        # Use Python to test WebSocket connection
        PYTHONPATH="$SCRIPT_DIR/lib" python3 - <<EOF
import sys
import platform

# Add our lib directory to the start of sys.path to ensure it's used first
sys.path.insert(0, "$SCRIPT_DIR/lib")

# Import our bundled websockets and verify its location
try:
    import websockets
    ws_location = getattr(websockets, '__file__', 'unknown location')
    print(f"Using Python {platform.python_version()} with bundled websockets {websockets.__version__}")
    print(f"Websockets loaded from: {ws_location}")
    if "$SCRIPT_DIR/lib" not in ws_location:
        print("Warning: Not using bundled websockets library!")
        sys.exit(1)
except ImportError as e:
    print(f"Error: Failed to import bundled websockets library: {e}")
    sys.exit(1)

import asyncio
import ssl
import json

async def test_websocket(uri, timeout_val, socket_type):
    try:
        # Create SSL context that accepts self-signed certificates
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        print(f"Attempting to connect to: {uri}")

        # Create connection using websockets but without loop parameter
        async with websockets.connect(
            uri,
            ssl=ssl_context,
            max_size=None,
            ping_timeout=None,
            origin="https://localhost:8443"
        ) as ws:
            print("WebSocket connection established, waiting for response message...")

            try:
                response = await asyncio.wait_for(ws.recv(), timeout=timeout_val)
                print(f"Received message: {response}")
                
                data = json.loads(response)

                # Different validation based on socket type
                if socket_type == "chat":
                    if data.get('type') != 'connection_established':
                        print("Did not receive expected connection_established message")
                        sys.exit(1)
                        
                    print("Chat connection verified")

                    # Wait for group message
                    try:
                        response = await asyncio.wait_for(ws.recv(), timeout=timeout_val)
                        print(f"Received group message: {response}")
                        data = json.loads(response)
                        if data.get('type') != 'group_message':
                            print("Did not receive expected group message")
                            sys.exit(1)
                        if data.get('message') != 'Channel layer test successful':
                            print("Unexpected group message content")
                            sys.exit(1)
                        print("Chat channel layer verified")
                    except asyncio.TimeoutError:
                        print("Timeout waiting for group message")
                        sys.exit(1)

                    # Send a test message to verify bi-directional communication
                    test_message = {
                        "message": "health_check",
                        "alias": "health_check",
                        "time": "now"
                    }
                    await ws.send(json.dumps(test_message))
                    print("Test message sent")

                elif socket_type == "game":
                    if data.get('type') != 'player_assignment':
                        print("Did not receive expected player_assignment message")
                        sys.exit(1)
                    if not data.get('player_id') or not data.get('game_id'):
                        print("Missing player or game ID in assignment message")
                        sys.exit(1)
                    print("Game connection verified")

                    # Send ready message
                    ready_message = {
                        "type": "player_ready"
                    }
                    print("Sending player ready message")
                    await ws.send(json.dumps(ready_message))
                    print("Ready message sent")

                    # Wait for game state update through group
                    try:
                        response = await asyncio.wait_for(ws.recv(), timeout=timeout_val)
                        print(f"Received game state update: {response}")
                        data = json.loads(response)
                        if data.get('type') != 'game_state_update':
                            print("Did not receive expected game state update")
                            sys.exit(1)
                        game_state = data.get('game_state', {})
                        if game_state.get('status') != 'playing':
                            print("Unexpected game state")
                            sys.exit(1)
                        print("Game channel layer verified")

                    except asyncio.TimeoutError:
                        print("Timeout waiting for game state update")
                        sys.exit(1)

                # Gracefully close the connection
                print(f"{socket_type.capitalize()} WebSocket check passed")
                await ws.close()
                sys.exit(0)
                
            except asyncio.TimeoutError:
                print(f"Timeout waiting for connection_established message after {timeout_val} seconds")
                sys.exit(1)
            
    except Exception as e:
        error_message = str(e)
        if "502" in error_message:
            print("Service returned 502 - Not ready yet")
            sys.exit(2) #Special exit code for 502
        print(f"WebSocket connection failed: {error_message}")
        sys.exit(1)

asyncio.run(test_websocket("$endpoint", float($timeout), "$socket_type"))
EOF

        result=$?
        if [ $result -eq 0 ]; then
            echo -e "${GREEN}✓ WebSocket check passed for $endpoint${NC}"
            return 0
        elif [ $result -eq 2 ]; then # Special code for 502
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                echo -e "${YELLOW}Backend not ready (502), retrying in $retry_delay seconds...${NC}"
                sleep $retry_delay
                continue
            else
                echo -e "${RED}Max retries reached, backend still not ready${NC}"
                return 1
            fi
        else
            echo -e "${RED}✗ WebSocket check failed for $endpoint${NC}"
            return 1
        fi
    done

    return 1
}

# Function to get the mapped port for a service
get_mapped_port() {
    local container=$1
    local port=$2
    docker port "$container" "$port" | cut -d ':' -f 2
}

# Main check function
main() {
    local host=${1:-"localhost"}
    local failures=0
    
    # Get the actual mapped port for nginx
    NGINX_PORT=$(get_mapped_port "nginx" "443")
    if [ -z "$NGINX_PORT" ]; then
        echo -e "${RED}Failed to get mapped port for nginx${NC}"
        return 1
    fi

    echo "Using NGINX port: $NGINX_PORT"

    # Test chat WebSocket using the correct path from nginx configuration
    echo -e "\n${GREEN}Testing Chat WebSocket:${NC}"
    check_websocket "wss://$host:$NGINX_PORT/ws/health/chat/" 5.0 "chat"
    [ $? -ne 0 ] && failures=$((failures + 1))

    # Test game WebSocket
    echo -e "\n${GREEN}Testing Game WebSocket:${NC}"
    check_websocket "wss://$host:$NGINX_PORT/ws/health/game/" 5.0 "game"
    [ $? -ne 0 ] && failures=$((failures + 1))

    return $failures
}

# Execute main function with provided arguments
main "$@"