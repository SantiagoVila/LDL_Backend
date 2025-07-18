// src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    // 1. Nivel de log: solo se registrarán los mensajes con este nivel o superior.
    // Niveles: error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
    level: 'info',

    // 2. Formato del log: cómo se verá cada mensaje.
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Muestra el stack trace de los errores
        winston.format.splat(),
        winston.format.json() // Guarda el log en formato JSON
    ),

    // 3. Dónde se guardan los logs (los "transportes")
    transports: [
        // Transporte para guardar errores críticos en un archivo
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // Transporte para guardar todos los logs en otro archivo
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Si no estamos en producción, también queremos ver los logs en la consola
// con colores y un formato más simple.
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(), // Añade colores
            winston.format.simple()    // Un formato simple: level: message
        )
    }));
}

module.exports = logger;