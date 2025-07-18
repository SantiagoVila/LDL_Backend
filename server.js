require('dotenv').config();
const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const logger = require('./src/config/logger');

// ===================================================================
// --- Configuración CORS para Express ---
// ===================================================================
app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.startsWith('http://localhost:5173') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      console.error(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ===================================================================
// --- Seguridad y limitadores ---
// ===================================================================
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===================================================================
// --- Configuración de Socket.IO con CORS ---
// ===================================================================
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (
        !origin ||
        origin.startsWith('http://localhost:5173') ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        console.error(`❌ Blocked by Socket.IO CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const activeUsers = new Map();
io.on('connection', (socket) => {
  logger.info(`Usuario conectado: ${socket.id}`);
  socket.on('register', (userId) => {
    activeUsers.set(userId.toString(), socket.id);
    logger.info(`Usuario ID ${userId} registrado con socket ID ${socket.id}`);
  });
  socket.on('disconnect', () => {
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
    logger.info(`Usuario desconectado: ${socket.id}`);
  });
});
app.set('socketio', io);
app.set('activeUsers', activeUsers);

// ===================================================================
// --- Rutas de la Aplicación ---
// ===================================================================
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

app.use('/api/usuarios', require('./src/routes/usuarios.routes'));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/equipos', require('./src/routes/equipos.routes'));
app.use('/api/mercado', require('./src/routes/mercado.routes'));
app.use('/api/transferencias', require('./src/routes/transferencias.routes'));
app.use('/api/jugadores', require('./src/routes/jugadores.routes'));
app.use('/api/ligas', require('./src/routes/ligas.routes'));
app.use('/api/partidos', require('./src/routes/partidos.routes'));
app.use('/api/notificaciones', require('./src/routes/notificaciones.routes'));
app.use('/api/noticias', require('./src/routes/noticias.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/reportes', require('./src/routes/reportes.routes'));
app.use('/api/stats', require('./src/routes/stats.routes'));
app.use('/api/logs', require('./src/routes/log.routes'));

// ===================================================================
// --- Manejo de Errores y Arranque del Servidor ---
// ===================================================================
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Ocurrió un error en el servidor' });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Servidor backend corriendo en el puerto ${PORT}`);
  });
}

module.exports = { app, server };
