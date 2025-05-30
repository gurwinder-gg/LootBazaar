import { durableSocketServer } from ".";

export function getName() {

}

export function heartBeat(socket: WebSocket, clientId: string, room: durableSocketServer) {
  const intervalId = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "heartbeat" }));
    } else {
      console.log("Delete client id :", clientId)
      clearInterval(intervalId);
      room.clients.delete(clientId);
    }
  }, 30000); // Send heartbeat every 30 seconds
}

export function generateClientId() {
  return Math.floor(Math.random() * 200) + 1;
}
