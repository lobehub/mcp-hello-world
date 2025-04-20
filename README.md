# Hello World MCP Server (for Testing)

A simple Model Context Protocol (MCP) server implementation built with TypeScript. **This server is primarily intended for testing and demonstrating basic MCP functionality.** It includes support for resources, prompts, and tools.

## Features

- SSE and STDIO transport support
- Resource handling with static and dynamic resources
- Sample prompt implementation
- Example tool that echoes messages
- Debug tool for server introspection

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

## Running the Server

There are multiple ways to run the server:

### Using npx (Recommended for quick testing)

After building the project (`npm run build`), you can run the server directly using `npx` in STDIO mode:

```bash
# Ensure the package is built and either published or linked locally
npx mcp-hello-world
```

### HTTP/SSE Transport (Web Browsers)

```bash
npm run start:http
```

This starts the server on http://localhost:3000 with:
- SSE endpoint at `/sse`
- Message endpoint at `/messages`

### STDIO Transport (Command Line)

```bash
npm run start
# or directly after building:
# node build/stdio.js
```

This runs the server in stdio mode for command-line integrations.

## Testing the Server

### Testing with cURL (HTTP Mode)

1.  Start the HTTP server:
    ```bash
    npm run start:http
    ```

2.  In a terminal window, connect to the SSE endpoint to get the Session ID:
    ```bash
    curl -N http://localhost:3000/sse
    ```
    You should see a response like:
    ```
    event: endpoint
    data: /messages?sessionId=YOUR_SESSION_ID
    ```
    **(Copy the actual `YOUR_SESSION_ID` value for the next steps)**

3.  In another terminal window, send a request to invoke the echo tool (replace `YOUR_SESSION_ID`):
    ```bash
    SESSION_ID="PASTE_YOUR_SESSION_ID_HERE"

    curl -X POST \
      "http://localhost:3000/messages?sessionId=${SESSION_ID}" \
      -H 'Content-Type: application/json' \
      -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/invoke",
        "params": {
          "name": "echo",
          "parameters": {
            "message": "Testing the MCP server!"
          }
        }
      }'
    ```

4.  You should see a response in the first (SSE) terminal window:
    ```
    event: message
    data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"Hello Testing the MCP server!"}]}}
    ```

5.  Try the debug tool (replace `YOUR_SESSION_ID`):
    ```bash
    curl -X POST \
      "http://localhost:3000/messages?sessionId=${SESSION_ID}" \
      -H 'Content-Type: application/json' \
      -d '{
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/invoke",
        "params": {
          "name": "debug",
          "parameters": {}
        }
      }'
    ```
    (Check the SSE terminal for the list of available methods)

### Testing with MCP Inspector

For a visual interface, you can use the [MCP Inspector](https://github.com/lobehub/mcp-inspector) tool:

1.  **HTTP Mode:** Start the server with `npm run start:http` and connect to `http://localhost:3000/sse` in the MCP Inspector.
2.  **STDIO Mode:** Run the server with `npm run start` or `npx mcp-hello-world` (after build/link) and connect using the STDIO transport option in the MCP Inspector.
3.  Browse available resources and tools.
4.  Invoke tools interactively.

*(Note: Screenshot URLs might need updating if they are placeholders or incorrect)*
![MCP Inspector HTTP Mode](https://github.com/user/repo/raw/main/screenshots/mcp-inspector-http.png)
![MCP Inspector STDIO Mode](https://github.com/user/repo/raw/main/screenshots/mcp-inspector-stdio.png)


## Server API

Based on the implementation in `src/server.ts`:

### Resources

- `hello://world` - A static hello world resource.
- `greeting://{name}` - A dynamic greeting resource that takes a name parameter.

### Tools

- `echo` - Echoes back a message prefixed with "Hello ". Takes a `message` parameter.
- `debug` - Lists all available server methods (resources, tools, prompts). Takes no parameters.

### Prompts

- `helpful-assistant` - A basic helpful assistant prompt definition.

## Troubleshooting

- If you get "Headers already sent" errors in HTTP mode, ensure no middleware is interfering with response handling.
- Session ID management is crucial for HTTP/SSE transport. Ensure the client sends the correct `sessionId` query parameter.
- Check the server console output for detailed debugging information and potential errors.
- Ensure you have run `npm run build` before attempting to run the server, especially via `npx` or direct `node` commands on built files.
- For `npx mcp-hello-world` to work, the package needs to be either published to npm or linked locally using `npm link` after building. Otherwise, use `npm run start` or `node build/stdio.js`.

## License

MIT
