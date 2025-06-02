import { McpAgent } from "agents/mcp";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Stripe from "stripe";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Stripe E-commerce MCP Server",
		version: "0.0.1",
	});

	async init() {
		const apiKey = process.env.STRIPE_API_KEY
		const stripe = new Stripe(apiKey as string)
		this.server.tool(
			"create_checkout_session",
			{ 
			  items: z.array(z.object({
				price_id: z.string(),
				quantity: z.number().int().positive()
			  })),
			  successUrl: z.string().url().default("https://example.com/success"),
			  cancelUrl: z.string().url().default("https://example.com/cancel")
			},
			async (params) => {
				const { items, successUrl, cancelUrl } = params
				const session = await stripe.checkout.sessions.create({
					success_url: successUrl,
					cancel_url: cancelUrl,
					mode: "payment",
					line_items: items.map(item => ({
						price: item.price_id,
						quantity: item.quantity,
					}))
				})
				return {
					content: [{
						type: "text",
						text: JSON.stringify(session)
					}]
				}
			}
		)
		this.server.tool(
			"list_products",
			{
				/**
				 * descriptionとmetadata[string]そしてnameを使った検索をサポートする
				 * ANDとORで組み合わせる
				*/
				description: z.string().optional().describe("Product description"),
				metadata: z.record(z.string()).optional().describe("Product metadata"),
				name: z.string().optional().describe("Product name"),
				operator: z.enum(["AND", "OR"]).optional().describe("Operator for AND/OR"),
				limit: z.number().default(10).describe("Limit the number of products to return"),
			},
			async ({limit, ...params}) => {
				if (Object.keys(params).length === 0) {
					const products = await stripe.products.list({
						active: true,
						expand: ["data.default_price"],
						limit
					})
					return {
						content: [{
							type: "text",
							text: JSON.stringify(products.data)
						}]
					}
				}
				const { description, metadata, name, operator } = params
				const query: string[] = [];
				if (description) query.push(`description:"${description}"`);
				if (name) query.push(`name:"${name}"`);
				if (metadata) {
					for (const [key, value] of Object.entries(metadata)) {
						query.push(`metadata["${key}"]:"${value}"`);
					}
				}
				const searchQuery = query.join(operator === "OR" ? " OR " : " AND ");
				const searchedProducts = await stripe.products.search({
					query: searchQuery,
					expand: ["data.default_price"],
					limit
				});
				return {
					content: [{
						type: "text",
						text: JSON.stringify(searchedProducts.data)
					}]
				}
			}
		)
		this.server.resource(
			"products",
			new ResourceTemplate("products://{product_id}", {
				list: undefined
			}),
		async () => {
			const products = await stripe.products.list({
				active: true
			})
			console.log(products)
			return {
				contents: products.data.map(product => {
					return {
						uri: `products://${product.id}`,
						text: JSON.stringify(product)
					}
				})
			}
		})
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
