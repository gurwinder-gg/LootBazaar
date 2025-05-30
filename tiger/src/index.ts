/**
 * @file index.ts
 * @description Main entry point for the WebSocket-based chat room application.
 */
import { DurableObject } from "cloudflare:workers";
import { Env, ClientInfo } from "./interfaces";
import { generateClientId, heartBeat } from "./utils";

/**
 * Main request handler for the Worker.
 * Routes requests to appropriate handlers based on the URL path.
 */

interface messageProps{
  type: string, 
  sender?: string,
 data: string,
 clientId : string,
 timestamp : string
}



export default {
  async fetch(request: Request, env: Env) {
    console.log(`Received request: ${request.method} ${request.url}`);
    const url = new URL(request.url);
    const path = url.pathname.slice(1).split('/');

    console.log(`Path: ${path.join('/')}`);

    if (path[0] === "api") {
      return handleApiRequest(path.slice(1), request, env);
    }

    console.log(`Unhandled path: ${path.join('/')}`);
    return new Response("Not found", { status: 404 });
  }
}

/**
 * Handles API requests, primarily for room creation and WebSocket connections.
 * @param path - Array of path segments
 * @param request - The incoming request
 * @param env - Environment variables and bindings
 * @returns Response object
 */
async function handleApiRequest(path: string[], request: Request, env: Env) {
  console.log(`Handling API request: ${path.join('/')}`);
  switch (path[0]) {
    case "room": {
      if (!path[1]) {
        if (request.method === "POST") {
          const id = env.rooms.newUniqueId();
          console.log(`Created new room: ${id}`);
          return new Response(id.toString(), { headers: { "Access-Control-Allow-Origin": "*" } });
        } else {
          console.log(`Method not allowed: ${request.method}`);
          return new Response("Method not allowed", { status: 405 });
        }
      }

      const roomName = path[1];
      let id;
      if (roomName.match(/^[0-9a-f]{64}$/)) {
        id = env.rooms.idFromString(roomName);
      } else if (roomName.length <= 32) {
        id = env.rooms.idFromName(roomName);
      } else {
        console.log(`Invalid room name: ${roomName}`);
        return new Response("Name too long", { status: 400 });
      }

      const roomObject = env.rooms.get(id);

      const newUrl = new URL(request.url);
      newUrl.pathname = "/websocket" + path.slice(2).join("/");
      console.log(`Forwarding to room: ${newUrl}`);

      return roomObject.fetch(newUrl, request);
    }
    default:
      console.log(`Unhandled API path: ${path[0]}`);
      return new Response("Not found", { status: 404 });
  }
}

/**
 * Durable Object class representing a chat room.
 * Handles WebSocket connections and message broadcasting.
 */
export class durableSocketServer extends DurableObject {
  clients: Map<string, { socket: WebSocket, info: ClientInfo }>;
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.env = env;
    this.clients = new Map();
  }

  /**
  * Handles incoming requests to the Durable Object.
  * @param request - The incoming request
  * @returns Response object
  */
  async fetch(request: Request) {
    console.log(`Durable Object received request: ${request.method} ${request.url}`);

    if (request.headers.get("Upgrade") === "websocket") {
      const clientId = generateClientId();
      if (!clientId) {
        console.log("Failed to generate client ID");
        return new Response("Failed to generate client ID", { status: 400 });
      }
      return this.handleWebSocket(request, clientId);
    }

    console.log(`Non-WebSocket request in Durable Object`);
    return new Response("Expected WebSocket", { status: 426 });
  }

  /**
   * Handles WebSocket connections.
   * @param request - The incoming WebSocket request
   * @param clientId - Unique ID for the client
   * @returns Response object with WebSocket
   */
  async handleWebSocket(request: Request, clientId: string) {
    if (request.headers.get("Upgrade") !== "websocket") {
      console.log("Non-WebSocket request received");
      return new Response("Expected WebSocket", { status: 426 });
    }

    

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const oldMessages = await this.state.storage.get<Array<object>>('messages') || [];

    server.accept();

    const clientInfo: ClientInfo = {
      id: clientId,
      joinTime: new Date(),
      messagesSent: 0,
      lastActive: new Date()
    };

    this.clients.set(clientId, { socket: server, info: clientInfo });

    console.log(`${clientId} joined the chat`);

    // Send all previous messages to the new connection
   
    console.log("Sending old messages:", oldMessages);

    // oldMessages.forEach(message => {
    //   server.send(JSON.stringify(message));
    // });

    

    server.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        const user = message.user;
        const avatarUrl = message.avatar;
        console.log(`Received message from client ${user}:`, message.data);

        const client = this.clients.get(clientId);
        if (client) {
          client.info.messagesSent++;
          client.info.lastActive = new Date();
        }

        if (message.type === "leave") {
          console.log(`${user} is leaving the chat`);
          this.clients.delete(clientId);
          server.close();
          this.broadcast({ type: "leave", data: `Client ${user} left the chat`, clientId : clientId, timestamp: new Date().toISOString(), sender : "server" } );
          return;
        }

        // Store the new message
        const newMessage = { type: "message", sender: user, avatar :avatarUrl, data: message.data, timestamp: new Date().toISOString(), clientId : clientId };

        const MAX_MESSAGES = 20; 
        if (oldMessages.length >= MAX_MESSAGES) {
          oldMessages.shift(); // Remove the oldest message
        }
        oldMessages.push(newMessage);
        console.log("Old messages :", oldMessages)

        await this.state.storage.transaction(async (txn) => {
          let messages = await txn.get('messages') || [];
          messages.push(newMessage);
          if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(-MAX_MESSAGES);
          }
          await txn.put('messages', messages);
        });

        // Broadcast the message to all clients, including the sender
        this.broadcast(newMessage);


      } catch (error) {
        console.error("Error processing message:", error);
        server.send(JSON.stringify({ type: "error", message: "Error processing your message" }));
      }
    });

    server.addEventListener('close', () => {
      console.log(`${clientId} left the chat`);
      
      this.clients.delete(clientId);
      server.close();
    });

    

    // Start periodic cleanup of inactive users
    setInterval(() => this.cleanupInactiveUsers(), 5 * 60 * 1000); // Run every 5 minutes

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Broadcasts a message to all connected clients.
   * @param message - The message to broadcast
   */
  broadcast(message: messageProps) {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);


    const userId = message.clientId;
    console.log("UserID : ", userId)

    this.clients.forEach((client, clientId) => {
      try {
        console.log("Client :", client.info.id);
        console.log("clientId : ", clientId)

        if(userId != clientId){
          client.socket.send(messageString);
        }
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  /**
   * Returns a list of active users and their information.
   * @returns Array of active user information
   */
  getActiveUsers() {
    const activeUsers = [];
    for (const [id, client] of this.clients) {
      activeUsers.push({
        id: client.info.id,
        joinTime: client.info.joinTime,
        messagesSent: client.info.messagesSent,
        lastActive: client.info.lastActive
      });
    }
    return activeUsers;
  }

  /**
   * Cleans up inactive users from the chat room.
   */
  cleanupInactiveUsers() {
    const now = new Date();
    for (const [id, client] of this.clients) {
      if (now.getTime() - client.info.lastActive.getTime() > 30 * 60 * 1000) { // 30 minutes
        this.clients.delete(id);
        client.socket.close();
        this.broadcast({ type: "leave", data: `Client ${id} timed out`, clientId : id });
      }
    }
  }
}
