#!/bin/bash

URL="https://localhost:8443"

CURL_OPTIONS="-k -s -o /dev/null -w '%{http_code}'"

error_occurred=0

echo "=== Test ModSecurity WAF ==="

# Test 1 : Injection SQL
echo -n "[Test 1] SQL Injection Attempt: "
response=$(curl $CURL_OPTIONS "$URL/?id=1%20AND%201=1" | tr -d "'")
if [ "$response" == "403" ]; then
    echo "Blocked ✅ (403 Forbidden)"
else
    echo "Not blocked ❌ (HTTP $response)"
    error_occurred=1
fi

# Test 2 : Path Traversal
echo -n "[Test 2] Path Traversal Attempt: "
response=$(curl $CURL_OPTIONS "$URL/test.php?file=../../etc/passwd" | tr -d "'")
if [ "$response" == "403" ]; then
    echo "Blocked ✅ (403 Forbidden)"
else
    echo "Not blocked ❌ (HTTP $response)"
    error_occurred=1
fi

# Test 3 : User-Agent suspecte
echo -n "[Test 3] User-Agent Injection (Nessus): "
response=$(curl $CURL_OPTIONS -A "Nessus" "$URL/" | tr -d "'")
if [ "$response" == "403" ]; then
    echo "Blocked ✅ (403 Forbidden)"
else
    echo "Not blocked ❌ (HTTP $response)"
    error_occurred=1
fi

# Test 4 : XSS Injection
echo -n "[Test 4] XSS Injection Attempt: "
response=$(curl $CURL_OPTIONS "$URL/?q=<script>alert('XSS')</script>" | tr -d "'")
if [ "$response" == "403" ]; then
    echo "Blocked ✅ (403 Forbidden)"
else
    echo "Not blocked ❌ (HTTP $response)"
    error_occurred=1
fi

# Test 5 : Command Injection
echo -n "[Test 5] Command Injection Attempt: "
response=$(curl $CURL_OPTIONS "$URL/?cmd=ls%20-la" | tr -d "'")
if [ "$response" == "403" ]; then
    echo "Blocked ✅ (403 Forbidden)"
else
    echo "Not blocked ❌ (HTTP $response)"
    error_occurred=1
fi

# Final result
if [ $error_occurred -eq 1 ]; then
    echo "An error has been detected"
    exit 1
else
    echo "All tests passed"
    exit 0
fi

echo "=== Tests over ==="
