# MCP Hello World - 用于测试的 MCP 服务端模拟

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

这是一个基于 TypeScript 实现的 **极简模型上下文协议 (MCP) 服务端**，其**主要目的是作为测试替身 (Test Double) / 模拟服务器 (Mock Server)**。

**核心用途**：在针对需要与 MCP 服务端交互的客户端代码进行**单元测试**或**集成测试**时，提供一个轻量级、可控且行为可预测的 MCP 服务端环境。

**注意：** 本项目**不适用于生产环境**或作为通用的 MCP 服务端部署。

## 为什么在测试中使用 `mcp-hello-world`？

在测试与 MCP 客户端相关的代码时，你通常不希望依赖一个真实的、可能复杂的、响应不确定的 AI 后端服务。使用 `mcp-hello-world` 作为测试替身有以下好处：

1.  **隔离性 (Isolation)**：让你的测试专注于客户端逻辑，而无需关心网络问题或真实服务端的可用性。
2.  **可预测性 (Predictability)**：提供的 `echo` 和 `debug` 工具行为简单且固定，方便编写断言。
3.  **速度 (Speed)**：启动和响应速度快，适合在单元测试中频繁使用。
4.  **轻量级 (Lightweight)**：依赖少，易于在测试环境中集成。
5.  **协议覆盖 (Protocol Coverage)**：同时支持 `STDIO` 和 `HTTP/SSE` 两种 MCP 传输协议，可以测试客户端在不同连接方式下的表现。

## 安装

将此包作为**开发依赖**添加到你的项目中：

```bash
# 使用 pnpm
pnpm add --save-dev mcp-hello-world

# 或者使用 bun
bun add --dev mcp-hello-world
```

## 手动运行 (用于调试测试)

有时你可能想手动运行服务来调试你的测试或客户端行为。

### STDIO 模式

这是最简单的运行方式，尤其是在本地开发和调试时。

```bash
# 确保已安装
# 使用 npx (通用)
npx mcp-hello-world

# 或者使用 pnpm dlx
pnpm dlx mcp-hello-world

# 或者使用 bunx
bunx mcp-hello-world
```

服务将监听标准输入，并将 MCP 响应输出到标准输出。你可以使用 [MCP Inspector](https://github.com/lobehub/mcp-inspector) 等工具连接到该进程。

### HTTP/SSE 模式

如果你需要通过网络接口进行调试，或者测试基于 HTTP 的 MCP 客户端。

```bash
# 1. 克隆仓库 (如果尚未在项目中安装)
# git clone https://github.com/lobehub/mcp-hello-world.git
# cd mcp-hello-world
# pnpm install / bun install

# 2. 构建项目
# 使用 pnpm
pnpm build
# 或者使用 bun
bun run build

# 3. 启动 HTTP 服务
# 使用 pnpm
pnpm start:http
# 或者使用 bun
bun run start:http
```

服务将在 `http://localhost:3000` 启动，并提供：
-   SSE 端点: `/sse`
-   消息端点: `/messages`

## 在测试中使用

你可以在你的测试框架（如 Jest, Vitest, Mocha 等）中，通过编程方式启动和停止 `mcp-hello-world` 服务，以便在自动化测试中使用。

### 示例：使用 STDIO 模式进行测试 (Node.js)

```typescript
// test/my-mcp-client.test.ts (示例使用 Jest)
import { spawn } from 'child_process';
import { MCPClient } from '../src/my-mcp-client'; // 假设这是你要测试的客户端

describe('My MCP Client (STDIO)', () => {
  let mcpServerProcess;
  let client: MCPClient;

  beforeAll(() => {
    // 在测试开始前启动 mcp-hello-world 进程
    // 使用 npx (或 pnpm dlx / bunx) 确保能找到并执行命令
    mcpServerProcess = spawn('npx', ['mcp-hello-world']);

    // 实例化你的客户端，并连接到子进程的 stdio
    client = new MCPClient(mcpServerProcess.stdin, mcpServerProcess.stdout);
  });

  afterAll(() => {
    // 测试结束后关闭 mcp-hello-world 进程
    mcpServerProcess.kill();
  });

  it('should receive echo response', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/invoke',
      params: { name: 'echo', parameters: { message: 'test message' } },
    };

    const response = await client.sendRequest(request); // 假设你的客户端有此方法

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
      result: { data: 'Hello Alice!' }, // 根据实际实现确认返回格式
    });
  });

  // ... 其他测试用例
});
```

### 示例：使用 HTTP/SSE 模式进行测试

对于 HTTP/SSE，你可能需要：
1.  在 `beforeAll` 中使用 `exec` 或 `spawn` 启动 `pnpm start:http` 或 `bun run start:http`。
2.  使用 HTTP 客户端 (如 `axios`, `node-fetch`, 或测试框架内置的) 连接到 `http://localhost:3000/sse` 和 `/messages` 端点进行测试。
3.  在 `afterAll` 中确保关闭启动的服务器进程。

## 提供的 MCP 能力 (用于测试断言)

`mcp-hello-world` 提供以下固定的能力，供你在测试中进行交互和断言：

### 资源 (Resources)

-   **`hello://world`**
    -   描述: 一个静态的 Hello World 资源。
    -   方法: `resources/get`
    -   参数: 无
    -   返回: `{ data: 'Hello World!' }`
-   **`greeting://{name}`**
    -   描述: 一个动态的问候资源。
    -   方法: `resources/get`
    -   参数: URI 中包含 `name`，例如 `greeting://Bob`。
    -   返回: `{ data: 'Hello {name}!' }` (例如: `{ data: 'Hello Bob!' }`)

### 工具 (Tools)

-   **`echo`**
    -   描述: 回显输入的消息，并添加 "Hello " 前缀。
    -   方法: `tools/invoke`
    -   参数: `{ name: 'echo', parameters: { message: string } }`
    -   返回: `{ content: [{ type: 'text', text: 'Hello {message}' }] }` (例如: `{ content: [{ type: 'text', text: 'Hello test' }] }`)
-   **`debug`**
    -   描述: 列出服务端所有可用的 MCP 方法定义。
    -   方法: `tools/invoke`
    -   参数: `{ name: 'debug', parameters: {} }`
    -   返回: 包含所有已注册的 resources, tools, prompts 定义的 JSON 结构。

### 提示词 (Prompts)

-   **`helpful-assistant`**
    -   描述: 一个基础的助手提示词定义。
    -   方法: `prompts/get`
    -   参数: 无
    -   返回: 一个包含预定义 `system` 和 `user` 角色的提示词结构 JSON。

## 许可证

MIT 