#!/bin/bash
echo "🚀 Setting up Rezona - AI ATS Resume Analyzer"
echo ""

# Create uploads folder
mkdir -p server/uploads

echo "📦 Installing backend dependencies..."
cd server && npm install
echo "✅ Backend ready!"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../client && npm install
echo "✅ Frontend ready!"

echo ""
echo "============================================"
echo "🎉 SETUP COMPLETE! Run the app:"
echo "============================================"
echo "Terminal 1: cd server && npm run dev"
echo "Terminal 2: cd client && npm start"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "📊 API:      http://localhost:5000/api/health"
echo "============================================"
