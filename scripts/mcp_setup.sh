#!/bin/bash
# Script to set up MCP servers on Gitpod startup
npm install -g @modelcontextprotocol/sdk
npx @modelcontextprotocol/create-server mcp-setup
cd mcp-setup
npm install
npm run build
echo "MCP servers setup completed."