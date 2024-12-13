#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check WebSocket connection
check_websocket() {
    local endpoint=$1
    local timeout=$2

    echo "Checking WebSocket endpoint: $endpoint"
    
    # Use Python to test WebSocket connection
    python3 - <<EOF
import asyncio
import websockets
import ssl
import sys
import json

async def test_websocket(uri, timeout_val):
    try:
        # Create SSL context that accepts self-signed certificates
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        print(f"Attempting to connect to: {uri}")
        
        # Parse URL to extract room name
        room_name = uri.rstrip('/').split('/')[-1]
        print(f"Room name: {room_name}")

        async with websockets.connect(
            uri,
            ssl=ssl_context,
            max_size=None,
            ping_timeout=None,
            # Add origin header as some Django setups require it
            origin="https://localhost:8443"
        ) as ws:
            print("WebSocket connection established, waiting for welcome message...")
            
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=timeout_val)
                print(f"Received message: {response}")
                
                data = json.loads(response)
                if data.get('type') != 'connection_established':
                    print("Did not receive expected connection_established message")
                    sys.exit(1)
                    
                print("Received correct connection_established message")

                # Send a test message to verify bi-directional communication
                test_message = {
                    "message": "health_check",
                    "alias": "health_check",
                    "time": "now"
                }
                await ws.send(json.dumps(test_message))
                print("Test message sent")

                # Gracefully close the connection
                await ws.close()
                sys.exit(0)
                
            except asyncio.TimeoutError:
                print(f"Timeout waiting for connection_established message after {timeout_val} seconds")
                sys.exit(1)
            
    except Exception as e:
        print(f"WebSocket connection failed: {str(e)}")
        sys.exit(1)

asyncio.run(test_websocket("$endpoint", float($timeout)))
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ WebSocket check passed for $endpoint${NC}"
        return 0
    else
        echo -e "${RED}✗ WebSocket check failed for $endpoint${NC}"
        return 1
    fi
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
    # Using 'test' as the room name to match the consumer's group_name
    check_websocket "wss://$host:$NGINX_PORT/ws/chat-server/test/" 5.0
    [ $? -ne 0 ] && failures=$((failures + 1))

    return $failures
}

# Execute main function with provided arguments
main "$@"