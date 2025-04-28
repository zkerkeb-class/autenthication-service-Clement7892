// src/utils/discord.ts
import { logger } from "./logger";

interface DiscordWebhookMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
  }>;
}

export class DiscordService {
  private webhookUrl: string = "";
  private serviceName: string = "";
  private enabled: boolean = false;
  private initialized: boolean = false;

  // Fonction d'initialisation à appeler après dotenv.config()
  initialize(): void {
    if (this.initialized) return;

    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
    this.serviceName = process.env.SERVICE_NAME || "";
    this.enabled = !!this.webhookUrl;

    if (!this.enabled) {
      logger.warn(
        "Discord notifications are disabled: DISCORD_WEBHOOK_URL not configured"
      );
    }

    this.initialized = true;
  }

  async sendServiceStatusNotification(
    status: "UP" | "DOWN",
    details?: string
  ): Promise<void> {
    // Initialiser si ce n'est pas déjà fait
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      const color = status === "UP" ? 3066993 : 15158332; // Vert pour UP, Rouge pour DOWN

      const message: DiscordWebhookMessage = {
        username: "CRM Monitoring",
        embeds: [
          {
            title: `Service ${this.serviceName} - ${status}`,
            description:
              status === "UP"
                ? `✅ Le service ${this.serviceName} est maintenant opérationnel`
                : `🚨 ALERTE: Le service ${this.serviceName} est DOWN`,
            color: color,
            fields: [
              {
                name: "Timestamp",
                value: timestamp,
                inline: true
              },
              {
                name: "Environnement",
                value: process.env.NODE_ENV || "development",
                inline: true
              }
            ],
            timestamp: timestamp
          }
        ]
      };

      // Ajouter les détails s'ils sont fournis
      if (details) {
        message.embeds![0].fields!.push({
          name: "Détails",
          value: details
        });
      }

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(
          `Discord API responded with status: ${response.status}`
        );
      }

      logger.info(`Discord notification sent: Service ${status}`);
    } catch (error) {
      logger.error("Failed to send Discord notification:", error);
    }
  }
}

// Créer une instance singleton
export const discordService = new DiscordService();
