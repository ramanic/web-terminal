#!/bin/bash

set -e

echo "Building frontend..."
cd frontend
pnpm install
pnpm run build
cd ..

mkdir -p backend/web
cp -r frontend/dist/* backend/web/

echo "Building backend..."
cd backend
go build -o web-terminal 
rm -rf web
