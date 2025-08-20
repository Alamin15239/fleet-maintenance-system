import { Server as ServerIOServer } from 'socket.io'

// Use globalThis to ensure the server instance is shared across all modules
declare global {
  var globalSocketServer: ServerIOServer | null
}

// Initialize the global variable if it doesn't exist
if (!global.globalSocketServer) {
  global.globalSocketServer = null
}

export const setServer = (server: ServerIOServer) => {
  console.log('Socket server instance set in socket-server.ts')
  global.globalSocketServer = server
}

export const getServer = (): ServerIOServer | null => {
  console.log('getServer called, returning:', global.globalSocketServer ? 'server instance' : 'null')
  return global.globalSocketServer
}