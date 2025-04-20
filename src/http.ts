#!/usr/bin/env node

import express from "express";
import { randomUUID } from "node:crypto"; // Import randomUUID
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; // Ensure McpServer is imported if createServer doesn't provide it directly
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "./server.js";

async function main() {
  // Create the MCP server instance
  const server: McpServer = createServer(); // Assuming createServer returns an McpServer instance

  // Create Express app
  const app = express();
  app.use(express.json()); // Use express.json() middleware for POST bodies
  const port = process.env.PORT || 3000;

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Handle POST requests for client-to-server communication and initialization
  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    console.log(`POST /mcp request received. Session ID: ${sessionId}`);
    console.log('Request body:', req.body);

    try {
      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        console.log(`Reusing transport for session ${sessionId}`);
        transport = transports[sessionId];
      } else if (!sessionId /* && isInitializeRequest(req.body) */) {
        // New initialization request (assuming first request without session ID is init)
        // TODO: Implement a more robust check for initialization requests if needed
        console.log("Initializing new session and transport.");
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore, // Enable resumability
          onsessioninitialized: (newSessionId) => {
            // Store the transport by session ID once initialized
            console.log(`Session ${newSessionId} initialized. Storing transport.`);
            transports[newSessionId] = transport;
          }
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId && transports[transport.sessionId]) {
            console.log(`Session ${transport.sessionId} closed. Removing transport.`);
            delete transports[transport.sessionId];
          }
        };

        // Connect the MCP server to the new transport
        console.log("Connecting MCP server to the new transport.");
        await server.connect(transport); // Connect the server instance from createServer()
      } else {
        // Invalid request (e.g., non-init request without a valid session ID)
        console.error(`Bad Request: Invalid session ID (${sessionId}) or request type.`);
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000, // Using a generic JSON-RPC server error code range
            message: `Bad Request: Invalid or missing session ID for this request type. Session ID received: ${sessionId}`,
          },
          id: req.body?.id || null, // Attempt to get the request ID from body
        });
        return;
      }

      // Handle the request using the transport
      console.log(`Handling POST request for session ${transport.sessionId || '(pending initialization)'}`);
      await transport.handleRequest(req, res, req.body);

    } catch (error: any) {
      console.error(`Error handling POST /mcp for session ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Internal Server Error: ${error.message || 'Unknown error'}`,
          },
          id: req.body?.id || null,
        });
      }
    }
  });

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    console.log(`${req.method} /mcp request received. Session ID: ${sessionId}`);

    if (!sessionId || !transports[sessionId]) {
      console.error(`Invalid or missing session ID for ${req.method} request: ${sessionId}`);
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = transports[sessionId];
    try {
      console.log(`Handling ${req.method} request for session ${sessionId}`);
      await transport.handleRequest(req, res);
    } catch (error: any) {
      console.error(`Error handling ${req.method} /mcp for session ${sessionId}:`, error);
      // transport.handleRequest might handle sending error responses for GET/DELETE
      if (!res.headersSent) {
         res.status(500).send(`Internal Server Error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Handle GET requests for server-to-client notifications
  app.get('/mcp', handleSessionRequest);

  // Handle DELETE requests for session termination
  app.delete('/mcp', handleSessionRequest);

  // Debug: log available methods (Keep if useful)
  // console.error('Available methods in the MCP server:');
  // console.error('Server object keys:', Object.keys(server));
  // console.error('Server constructor:', server.constructor.name);

  // Start the server
  app.listen(port, () => {
    console.error(`Hello World MCP Server (Streamable HTTP) running on http://localhost:${port}`);
    console.error(`- Use POST /mcp for sending messages and initialization.`);
    console.error(`- Use GET /mcp for receiving server notifications.`);
    console.error(`- Use DELETE /mcp for terminating sessions.`);
    console.error(`- Remember to include 'mcp-session-id' header for established sessions.`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});