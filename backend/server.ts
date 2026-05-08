import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ""; // Using anon key for now, could use service_role if needed for backend bypass

const supabase = createClient(supabaseUrl, supabaseKey);

const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    category: String!
    buying_price: Float
    selling_price: Float
    quantity: Int
    low_stock_threshold: Int
  }

  type Sale {
    id: ID!
    product_id: ID!
    quantity: Int!
    total_price: Float!
    created_at: String!
  }

  type Query {
    products: [Product]
    sales: [Sale]
    product(id: ID!): Product
    productSales(productId: ID!): [Sale]
  }

  type Mutation {
    createProduct(name: String!, category: String!, buying_price: Float!, selling_price: Float!, quantity: Int!, low_stock_threshold: Int!): Product
    updateProduct(id: ID!, name: String, category: String, buying_price: Float, selling_price: Float, quantity: Int, low_stock_threshold: Int): Product
    deleteProduct(id: ID!): Boolean
    recordSale(productId: ID!, quantity: Int!, totalPrice: Float!): Sale
  }
`;

const resolvers = {
  Query: {
    products: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    },
    sales: async () => {
      const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    product: async (_: any, { id }: any) => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    productSales: async (_: any, { productId }: any) => {
      const { data, error } = await supabase.from('sales').select('*').eq('product_id', productId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  },
  Mutation: {
    createProduct: async (_: any, args: any) => {
      const { data, error } = await supabase.from('products').insert([args]).select().single();
      if (error) throw error;
      return data;
    },
    updateProduct: async (_: any, { id, ...updates }: any) => {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    deleteProduct: async (_: any, { id }: any) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    recordSale: async (_: any, { productId, quantity, totalPrice }: any) => {
      // Record sale
      const { data: sale, error: saleError } = await supabase.from('sales').insert([{
        product_id: productId,
        quantity,
        total_price: totalPrice
      }]).select().single();
      
      if (saleError) throw saleError;
      
      // Update quantity
      const { data: product } = await supabase.from('products').select('quantity').eq('id', productId).single();
      if (product) {
        await supabase.from('products').update({ quantity: product.quantity - quantity }).eq('id', productId);
      }
      
      return sale;
    }
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(bodyParser.json());

  app.use("/graphql", expressMiddleware(server));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running with GraphQL API" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
