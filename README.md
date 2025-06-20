# MCP Hello World - MCP Server Mock for Testing

[![][npm-release-shield]][npm-release-link]
[![][npm-downloads-shield]][npm-downloads-link]
[![][github-action-test-shield]][github-action-test-link]
[![][github-action-release-shield]][github-action-release-link]

[github-action-release-link]: https://github.com/lobehub/mcp-hello-world/actions/workflows/release.yml
[github-action-release-shield]: https://img.shields.io/github/actions/workflow/status/lobehub/mcp-hello-world/release.yml?label=Release&logo=githubactions&logoColor=white&style=flat-square
[github-action-test-link]: https://github.com/lobehub/mcp-hello-world/actions/workflows/test.yml
[github-action-test-shield]: https://img.shields.io/github/actions/workflow/status/lobehub/mcp-hello-world/test.yml?label=Test&logo=githubactions&logoColor=white&style=flat-square
[npm-downloads-link]: https://www.npmjs.com/package/mcp-hello-world
[npm-downloads-shield]: https://img.shields.io/npm/dt/mcp-hello-world?label=Downloads&logo=npm&style=flat-square
[npm-release-link]: https://www.npmjs.com/package/mcp-hello-world
[npm-release-shield]: https://img.shields.io/npm/v/mcp-hello-world?logo=npm&style=flat-square

This is a **minimal Model Context Protocol (MCP) server** implemented in TypeScript, primarily intended to serve as a **Test Double / Mock Server**.

**Core Purpose**: To provide a lightweight, controllable, and predictable MCP server environment for **unit testing** or **integration testing** client code that needs to interact with an MCP server.

**Note:** This project is **not suitable for production environments** or deployment as a general-purpose MCP server.

[![MCP Badge](https://lobehub.com/badge/mcp-full/lobehub-mcp-hello-world)](https://lobehub.com/mcp/lobehub-mcp-hello-world)

## Why Use `mcp-hello-world` in Tests?

When testing code related to MCP clients, you usually don't want to depend on a real, potentially complex, and unpredictably responsive AI backend service. Using `mcp-hello-world` as a test double offers several advantages:

1.  **Isolation**: Focus your tests on client logic without worrying about network issues or the availability of the real server.
2.  **Predictability**: The provided `echo` and `debug` tools have simple, fixed behaviors, making it easy to write assertions.
3.  **Speed**: Fast startup and response times, suitable for frequent use in unit tests.
4.  **Lightweight**: Few dependencies, easy to integrate into test environments.
5.  **Protocol Coverage**: Supports both `STDIO` and `HTTP/SSE` MCP transport protocols, allowing you to test client behavior under different connection methods.

## Installation

Add this package as a **dev dependency** to your project:

```bash
# Using pnpm
pnpm add --save-dev mcp-hello-world

# Or using bun
bun add --dev mcp-hello-world
```

## Manual Execution (for Debugging Tests)

You might want to run the server manually sometimes to debug your tests or client behavior.

### STDIO Mode

This is the simplest way to run, especially during local development and debugging.

```bash
# Ensure it's installed (globally or in the project)
# Using npx (universal)
npx mcp-hello-world

# Or using pnpm dlx
pnpm dlx mcp-hello-world

# Or using bunx
bunx mcp-hello-world
```

The server will listen on standard input and output MCP responses to standard output. You can use tools like [MCP Inspector](https://github.com/lobehub/mcp-inspector) to connect to the process.

To configure this server in your MCP client, add the following to your configuration:

```json
{
  "mcpServers": {
    "mcp-hello-world": {
      "command": "npx",
      "args": ["mcp-hello-world"]
    }
  }
}
```

### HTTP/SSE Mode

If you need to debug via a network interface or test HTTP-based MCP clients.

```bash
# 1. Clone the repository (if not already installed in the project)
# git clone https://github.com/lobehub/mcp-hello-world.git
# cd mcp-hello-world
# pnpm install / bun install

# 2. Build the project
# Using pnpm
pnpm build
# Or using bun
bun run build

# 3. Start the HTTP server
# Using pnpm
pnpm start:http
# Or using bun
bun run start:http
```

The server will start on `http://localhost:3000` and provide:
-   SSE endpoint: `/sse`
-   Message endpoint: `/messages`

## Usage in Tests

You can programmatically start and stop the `mcp-hello-world` server within your test framework (like Jest, Vitest, Mocha, etc.) for automated testing.

### Example: Testing with STDIO Mode (Node.js)

```typescript
// test/my-mcp-client.test.ts (Example using Jest)
import { spawn } from 'child_process';
import { MCPClient } from '../src/my-mcp-client'; // Assuming this is your client code

describe('My MCP Client (STDIO)', () => {
  let mcpServerProcess;
  let client: MCPClient;

  beforeAll(() => {
    // Start the mcp-hello-world process before tests
    // Using npx (or pnpm dlx / bunx) ensures the command is found and executed
    mcpServerProcess = spawn('npx', ['mcp-hello-world']);

    // Instantiate your client and connect to the subprocess's stdio
    client = new MCPClient(mcpServerProcess.stdin, mcpServerProcess.stdout);
  });

  afterAll(() => {
    // Shut down the mcp-hello-world process after tests
    mcpServerProcess.kill();
  });

  it('should receive echo response', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/invoke',
      params: { name: 'echo', parameters: { message: 'test message' } },
    };

    const response = await client.sendRequest(request); // Assuming your client has this method

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: { content: [{ type: 'text', text: 'Hello test message' }] },
    });
  });

  it('should get greeting resource', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/get',
      params: { uri: 'greeting://Alice' },
    };
    const response = await client.sendRequest(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 2,
      result: { data: 'Hello Alice!' }, // Confirm return format based on actual implementation
    });
  });

  // ... other test cases
});
```

### Example: Testing with HTTP/SSE Mode

For HTTP/SSE, you might need to:
1.  Use `exec` or `spawn` in `beforeAll` to start `pnpm start:http` or `bun run start:http`.
2.  Use an HTTP client (like `axios`, `node-fetch`, or your test framework's built-in client) to connect to `http://localhost:3000/sse` and `/messages` for testing.
3.  Ensure you shut down the started server process in `afterAll`.

## Provided MCP Capabilities (for Test Assertions)

`mcp-hello-world` provides the following fixed capabilities for interaction and assertion in your tests:

### Resources

-   **`hello://world`**
    -   Description: A static Hello World resource.
    -   Method: `resources/get`
    -   Parameters: None
    -   Returns: `{ data: 'Hello World!' }`
-   **`greeting://{name}`**
    -   Description: A dynamic greeting resource.
    -   Method: `resources/get`
    -   Parameters: `name` included in the URI, e.g., `greeting://Bob`.
    -   Returns: `{ data: 'Hello {name}!' }` (e.g., `{ data: 'Hello Bob!' }`)

### Tools

-   **`echo`**
    -   Description: Echoes the input message, prefixed with "Hello ".
    -   Method: `tools/invoke`
    -   Parameters: `{ name: 'echo', parameters: { message: string } }`
    -   Returns: `{ content: [{ type: 'text', text: 'Hello {message}' }] }` (e.g., `{ content: [{ type: 'text', text: 'Hello test' }] }`)
-   **`debug`**
    -   Description: Lists all available MCP method definitions on the server.
    -   Method: `tools/invoke`
    -   Parameters: `{ name: 'debug', parameters: {} }`
    -   Returns: A JSON structure containing definitions for all registered resources, tools, and prompts.

### Prompts

-   **`helpful-assistant`**
    -   Description: A basic assistant prompt definition.
    -   Method: `prompts/get`
    -   Parameters: None
    -   Returns: A JSON structure for the prompt with predefined `system` and `user` roles.

## License

MIT
