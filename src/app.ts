import dotenv from "dotenv";
dotenv.config();
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config";
import session from "express-session";
import passport from "./config/passport.config";
import routes from "./routes/index";
import { errorMiddleware } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";
import { setupSwagger } from "./config/swagger.config";

const app: Application = express();

app.use(
  session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.server.env === "production",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

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
app.get("/", (req, res) => {
  res.json({ message: "Auth Microservice API is running" });
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send("// Service worker vide pour éviter les erreurs 404");
});

// Configuration de Swagger
setupSwagger(app);

app.use("/api", routes);

// Health check
app.get("/health", async (req: Request, res: Response) => {
  const status = {
    status: "UP",
    timestamp: new Date().toISOString(),
    service: config.discord.service_name
  };

  res.status(200).json(status);
});

app.use(errorMiddleware);

export { app };
