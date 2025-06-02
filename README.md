# [Experimental Demo] Stripe E-commerce MCP Server

This demo application demonstrates how to deploy a remote MCP server with Stripe integration on Cloudflare Workers. This server provides e-commerce functionality using Stripe and operates without authentication.

## Features

This MCP server provides the following functionality:

### Tools
- **create_checkout_session**: Create Stripe checkout sessions
- **list_products**: Retrieve product listings (with search and filtering capabilities)

### Resources
- **products**: Access to Stripe product data

## Configuration

### Required Environment Variables
- `STRIPE_API_KEY`: Your Stripe API key

## Deployment

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

Alternatively, you can create the MCP server locally using the command line:
```bash
npm create cloudflare@latest -- stripe-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

After deployment, your MCP server will be accessible at a URL like:
`stripe-mcp-server.<your-account>.workers.dev/sse`

## Usage

### 1. Connecting to Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`stripe-mcp-server.<your-account>.workers.dev/sse`)
3. You can now use the Stripe MCP tools directly from the playground!

### 2. Connecting to Claude Desktop

You can also connect from local MCP clients using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote).

To connect your MCP server to Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and add the following configuration in Claude Desktop > Settings > Developer > Edit Config:

```json
{
  "mcpServers": {
    "stripe-commerce": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or stripe-mcp-server.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and the tools will become available.

## API Specification

### create_checkout_session
Creates a Stripe checkout session.

**Parameters:**
- `items`: Array of product price_id and quantity
- `successUrl`: Redirect URL on successful payment (optional)
- `cancelUrl`: Redirect URL on payment cancellation (optional)

### list_products
Retrieves product listings. Provides search and filtering functionality.

**Parameters:**
- `description`: Search by product description (optional)
- `metadata`: Search by metadata (optional)
- `name`: Search by product name (optional)
- `operator`: AND/OR search operator (optional)
- `limit`: Maximum number of products to retrieve (default: 10)

## Setup Notes

1. Obtain a valid API key from your Stripe dashboard
2. Set the STRIPE_API_KEY environment variable
3. Ensure that valid products are created in your Stripe account

## Development and Customization

To add your own [tools](https://developers.cloudflare.com/agents/model-context-protocol/tools/) to the MCP server, define each tool inside the `init()` method of `src/index.ts` using `this.server.tool(...)`.
