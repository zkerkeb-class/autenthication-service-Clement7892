const config = {
  server: {
    host: process.env.HOST || "localhost",
    port: process.env.PORT || 3002,
    env: process.env.NODE_ENV || "development",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
    notification_url: process.env.NOTIFICATION_URL || "",
    protocol: process.env.PROTOCOL || "http"
  },
  database: {
    mongoUri: process.env.MONGO_URI || ""
  },
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "6h"
  },
  logging: {
    level: process.env.LOG_LEVEL || "info"
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callback: process.env.GOOGLE_CALLBACK_URL || ""
  },
  discord: {
    service_name: process.env.SERVICE_NAME || "authentication"
  }
};

export default config;
