export interface Env {
  rooms: DurableObjectNamespace;
}

export interface ClientInfo {
  id: string;
  joinTime: Date;
  messagesSent: number;
  lastActive: Date;
}
