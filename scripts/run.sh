#!/bin/bash

# Navigate to the root directory
cd "$(dirname "$0")"

# Step 1: Install dependencies and build mira-ai
echo "Installing mira-ai dependencies and building..."
cd mira-ai
pnpm install
pnpm build

# Step 2: Navigate back to the root directory
cd ..

# Step 3: Install root dependencies
echo "Installing root dependencies..."
pnpm install

# Step 4: Start the application
echo "Starting the application..."
pnpm start