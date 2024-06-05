#!/bin/sh
npm --registry=http://localhost:4873 install
npm run format:write
npm run lint
npm run build
npm run test
npm --registry=http://localhost:4873 update
git status
echo "Please enter a commit message"
read message
git add --all
git commit -m "'$message'"
git push origin main
npm run version
npm run publish
npm run docs
npm run pages