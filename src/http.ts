#!/usr/bin/env node

import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./server.js";

async function main() {
  // Create the server
  const server = createServer();
  
  // Create Express app
  const app = express();
  const port = process.env.PORT || 3000;
  
  // Server-side connections
  const connections = new Map();
  
  // Handle SSE connections
  app.get("/sse", async (req, res) => {
    // Generate a unique connection ID (UUID format)
    const sessionId = req.query.sessionId as string || 
                     `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;
    
    try {
      // Create a new SSE transport
      const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
      connections.set(sessionId, transport);
      
      // Connect the server to this transport
      await server.connect(transport);
    } catch (error: any) {
      console.error('Error establishing SSE connection:', error);
      // If headers already sent due to transport.start(), don't try to set them again
      if (!res.headersSent) {
        res.status(500).end(`Server error: ${error.message || 'Unknown error'}`);
      }
    }
    
    // Handle client disconnect
    req.on("close", () => {
      if (connections.has(sessionId)) {
        connections.delete(sessionId);
        console.error(`Client ${sessionId} disconnected`);
      }
    });
  });
  
  // Handle messages from client
  app.post("/messages", express.json(), async (req, res) => {
    try {
      // Extract sessionId from query parameters
      const sessionId = req.query.sessionId as string;
      
      console.log(`Received message for session ${sessionId}, body:`, req.body);
      
      if (!sessionId || !connections.has(sessionId)) {
        // If no sessionId or connection not found, try the first connection
        if (connections.size === 0) {
          return res.status(400).json({ error: "No active connections" });
        }
        console.log('Using first available connection');
        const transport = connections.values().next().value;
        await transport.handlePostMessage(req, res, req.body);
      } else {
        // Use the specific connection for this session
        console.log(`Using connection for session ${sessionId}`);
        const transport = connections.get(sessionId);
        await transport.handlePostMessage(req, res, req.body);
      }
    } catch (error: any) {
      console.error('Error handling message:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: `Internal server error: ${error.message || 'Unknown error'}` });
      }
    }
  });
  
  // Debug: log available methods
  console.error('Available methods in the MCP server:');
  console.error('Server object keys:', Object.keys(server));
  console.error('Server constructor:', server.constructor.name);
  
  // Start the server
  app.listen(port, () => {
    console.error(`Hello World MCP Server running on http://localhost:${port}`);
    console.error(`- Connect to /sse for server-sent events`);
    console.error(`- Send messages to /messages endpoint`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});