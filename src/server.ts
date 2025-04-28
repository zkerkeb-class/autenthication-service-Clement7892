import { app, healthMonitor } from "./app";
import connectDB from "./config/db.config";
import { logger } from "./utils/logger";
import { discordService } from "./utils/discord";

const PORT = process.env.PORT;

connectDB();

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  // Envoyer une notification de démarrage du service
  discordService.sendServiceStatusNotification(
    "UP",
    "Service démarré avec succès"
  );

  // Démarrer le moniteur de santé
  healthMonitor.start();
});

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = async () => {
  logger.info("Received shutdown signal, closing server...");

  // Arrêter le moniteur de santé
  healthMonitor.stop();

  // Envoyer une notification d'arrêt planifié
  await discordService.sendServiceStatusNotification(
    "DOWN",
    "Arrêt planifié du service"
  );

  // Fermer le serveur HTTP
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });

  // Si la fermeture prend trop de temps, forcer l'arrêt
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Écouter les signaux d'arrêt
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default server;
