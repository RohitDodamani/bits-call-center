#!/bin/bash
# start_api.sh

# Detect script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Set environment (default to dev if not provided)
ENV=${1:-dev}
echo "Starting Backend API in $ENV mode..."
export NODE_ENV=$ENV

# Check dependencies in project root (where package.json is)
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo "node_modules not found in root. Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server..."
node backend/server.js
