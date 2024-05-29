const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let log = console.log

async function init() {
  app.use(express.static(__dirname));

  io.on('connection', (socket) => {
    log('user connected:', socket.id);

    socket.on('drawing', async (data) => {
      log('socket.on drawing', data)
//       await saveDrawing(socket.id, data);
      socket.broadcast.emit('drawing', data);
    });

    socket.on('start-drawing', (data) => {
      log('socket.on start-drawing', data)
      socket.broadcast.emit('start-drawing', data);
    });

    socket.on('log', (data) => {
      log('log', data)
    });

    socket.on('disconnect', () => {
      log('user disconnected:', socket.id);
    });
  });

  async function saveDrawing(userId, drawingData) {
    log("Drawing not saved:");
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    log(`Server is running on port: ${port}`);
  });
}

init().catch((error) => {
  error("mist.", error);
});
