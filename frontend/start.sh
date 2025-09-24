#!/bin/bash

# eSigned Frontend Startup Script

echo "🚀 Starting eSigned Frontend Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating environment configuration..."
    echo "VUE_APP_API_URL=http://localhost:5000" > .env
    echo "VUE_APP_TITLE=eSigned - Digital Document Signing" >> .env
fi

# Start the development server
echo "🌟 Starting development server..."
echo "📱 Application will be available at: http://localhost:8080"
echo "🔗 Make sure the backend API is running on: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run serve
