#!/bin/bash

echo "🔧 Killing processes on port 8081..."
# Kill any process using port 8081
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "No processes found on port 8081"

echo "🧹 Clearing Expo cache..."
# Clear Expo cache
npx expo start --clear --port 8081

echo "✅ Server restarted on port 8081"
