#!/bin/bash

echo "🚀 Setting up $USDUC DEGEN IDEAS Platform 🚀"
echo "=============================================="

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

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your actual values:"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - MONGODB_URI (your MongoDB connection string)"
    echo "   - TWITTER_CLIENT_ID (from Twitter Developer Portal)"
    echo "   - TWITTER_CLIENT_SECRET (from Twitter Developer Portal)"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Edit .env.local with your actual values"
echo "2. Set up Twitter OAuth in Twitter Developer Portal"
echo "3. Set up MongoDB database"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "🔥 GET RICH OR DIE TRYING 💥"

