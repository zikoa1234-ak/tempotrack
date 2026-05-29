#!/bin/bash

# Script to push TempoTrack changes to GitHub
# Before running, replace YOUR_GITHUB_USERNAME and YOUR_REPO_NAME below

GITHUB_USERNAME="YOUR_GITHUB_USERNAME"
REPO_NAME="tempotrack"  # Change this to your repository name
GITHUB_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo "🚀 Preparing to push TempoTrack to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Run: git init"
    exit 1
fi

# Check if we have commits
if ! git log --oneline -1 > /dev/null 2>&1; then
    echo "❌ No commits found. Please commit your changes first."
    exit 1
fi

# Set git user if not set
if [ -z "$(git config user.name)" ]; then
    echo "📝 Setting git user configuration..."
    read -p "Enter your name: " USER_NAME
    read -p "Enter your email: " USER_EMAIL
    git config user.name "$USER_NAME"
    git config user.email "$USER_EMAIL"
fi

# Check if remote exists
if git remote -v | grep -q "origin"; then
    echo "✅ Remote 'origin' already exists"
    CURRENT_URL=$(git remote get-url origin)
    echo "Current remote URL: $CURRENT_URL"
    
    read -p "Do you want to change the remote URL? (y/n): " CHANGE_REMOTE
    if [[ $CHANGE_REMOTE == "y" || $CHANGE_REMOTE == "Y" ]]; then
        git remote remove origin
        git remote add origin "$GITHUB_URL"
        echo "✅ Updated remote URL to: $GITHUB_URL"
    fi
else
    echo "🔗 Adding remote repository..."
    git remote add origin "$GITHUB_URL"
    echo "✅ Added remote: $GITHUB_URL"
fi

# Check the current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    git branch -M main
    CURRENT_BRANCH="main"
fi

echo "📤 Pushing to GitHub..."
echo "Repository: $GITHUB_URL"
echo "Branch: $CURRENT_BRANCH"

# Try to push
if git push -u origin "$CURRENT_BRANCH"; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Open in browser: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
    echo "❌ Push failed. Possible reasons:"
    echo "   1. Repository doesn't exist on GitHub"
    echo "   2. No write permissions"
    echo "   3. Network issues"
    echo ""
    echo "📋 To create the repository on GitHub:"
    echo "   1. Go to https://github.com/new"
    echo "   2. Create repository named: $REPO_NAME"
    echo "   3. Don't initialize with README (since we have existing code)"
    echo "   4. Then run this script again"
fi

echo ""
echo "📁 Summary of changes pushed:"
echo "============================="
git log --oneline -5