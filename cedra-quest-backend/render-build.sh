#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🏗️ Building NestJS application..."
npx nest build

echo "📁 Checking build output..."
ls -la dist/

echo "✅ Build completed!"