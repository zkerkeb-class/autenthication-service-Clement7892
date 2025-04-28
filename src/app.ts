import dotenv from "dotenv";
dotenv.config();
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import swaggerUi from "swagger-ui-express";
import session from "express-session";
import passport from "./config/passport.config"; // Importez votre config Passport
import routes from "./routes/index";
import { HealthMonitor } from "./utils/healthMonitor";
import { discordService } from "./utils/discord";
import { errorMiddleware } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";

const app: Application = express();

// Configuration des sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
  })
);
console.log({
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  SERVICE_NAME: process.env.SERVICE_NAME
});

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  })
);
// Route de base pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
  res.json({ message: "Auth Microservice API is running" });
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send("// Service worker vide pour éviter les erreurs 404");
});
// Routes
app.use("/api", routes);

// Swagger documentation - À configurer plus tard
// const swaggerDocument = require('../swagger.json');
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get("/health", async (req: Request, res: Response) => {
  // Vérifie si une vérification manuelle est demandée
  const forceCheck = req.query.check === "true";
  const notifyDiscord = req.query.notify === "true";

  // Pour cet exemple, nous considérons le service comme sain si l'endpoint est accessible
  const status = { status: "UP", timestamp: new Date().toISOString() };

  // Si une notification est demandée, l'envoyer via Discord
  if (notifyDiscord) {
    await discordService.sendServiceStatusNotification(
      "UP",
      "Vérification manuelle demandée via l'endpoint /health"
    );
  }

  // Si une vérification manuelle est demandée, exécuter le healthMonitor
  if (forceCheck && healthMonitor) {
    await healthMonitor.performCheck();
  }

  res.status(200).json(status);
});

// Créer une fonction de vérification de santé personnalisée
const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Ici, vous pouvez ajouter une logique de vérification plus complexe
    // Par exemple, vérifier la connexion à la base de données, aux services externes, etc.

    // Pour cet exemple simple, nous considérons le service comme sain s'il est en cours d'exécution
    return true;
  } catch (error) {
    logger.error("Health check failed:", error);
    return false;
  }
};

// Initialiser et démarrer le moniteur de santé
const healthMonitor = new HealthMonitor(
  checkApiHealth,
  parseInt(process.env.HEALTH_CHECK_INTERVAL || "60000")
);

// Error handling
app.use(errorMiddleware);

// Exporter à la fois l'app et le healthMonitor
export { app, healthMonitor };
