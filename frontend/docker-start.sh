#!/bin/bash

# eSigned Frontend Docker Startup Script

echo "🐳 Starting eSigned Frontend with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Navigate to the project root
cd /home/meson/Meson/eSigned/app

echo "🔨 Building and starting all services..."
echo "📱 Frontend will be available at: http://localhost:8080"
echo "🔗 Backend API will be available at: http://localhost:5000"
echo "🗄️ MongoDB will be available at: http://localhost:27017"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Build and start all services
docker-compose up --build
