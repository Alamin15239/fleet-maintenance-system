import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    console.log('📊 Transport:', socket.conn.transport.name);
    console.log('🌐 Client origin:', socket.handshake.headers.origin);
    
    // Join dashboard room for real-time updates
    socket.on('join-dashboard', () => {
      socket.join('dashboard');
      console.log('📊 Client joined dashboard room:', socket.id);
    });

    // Leave dashboard room
    socket.on('leave-dashboard', () => {
      socket.leave('dashboard');
      console.log('📊 Client left dashboard room:', socket.id);
    });
    
    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper functions to broadcast dashboard updates
export const broadcastDashboardUpdate = (io: Server, updateType: string, data: any) => {
  io.to('dashboard').emit('dashboard-update', {
    type: updateType,
    data,
    timestamp: new Date().toISOString()
  });
};

export const broadcastTruckUpdate = (io: Server, action: string, truckData: any) => {
  io.to('dashboard').emit('truck-update', {
    action,
    data: truckData,
    timestamp: new Date().toISOString()
  });
};

export const broadcastMaintenanceUpdate = (io: Server, action: string, maintenanceData: any) => {
  io.to('dashboard').emit('maintenance-update', {
    action,
    data: maintenanceData,
    timestamp: new Date().toISOString()
  });
};