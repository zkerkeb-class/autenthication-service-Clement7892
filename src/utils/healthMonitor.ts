// src/utils/healthMonitor.ts
import { discordService } from "./discord";
import { logger } from "./logger";

export class HealthMonitor {
  private isCurrentlyHealthy: boolean = true;
  private checkInterval: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private healthCheckFn: () => Promise<boolean>;

  /**
   * Crée un moniteur de santé qui vérifie périodiquement l'état du service
   * @param healthCheckFn Fonction qui retourne une promesse résolue avec true si le service est sain, false sinon
   * @param intervalMs Intervalle entre les vérifications en millisecondes (défaut: 60000 = 1 minute)
   */
  constructor(
    healthCheckFn: () => Promise<boolean>,
    intervalMs: number = 60000
  ) {
    this.healthCheckFn = healthCheckFn;
    this.intervalMs = intervalMs;
  }

  /**
   * Démarre la surveillance
   */
  start(): void {
    if (this.checkInterval) {
      return;
    }

    logger.info(
      `Starting health monitoring with ${this.intervalMs}ms interval`
    );

    // Effectuer une vérification immédiate
    this.checkHealth();

    // Puis configurer l'intervalle de vérification régulier
    this.checkInterval = setInterval(() => this.checkHealth(), this.intervalMs);
  }

  /**
   * Arrête la surveillance
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info("Health monitoring stopped");
    }
  }

  /**
   * Vérifie la santé du service et envoie des notifications en cas de changement d'état
   */
  private async checkHealth(): Promise<void> {
    try {
      const isHealthy = await this.healthCheckFn();

      // Si l'état a changé, envoyer une notification
      if (isHealthy !== this.isCurrentlyHealthy) {
        const status = isHealthy ? "UP" : "DOWN";
        const details = isHealthy
          ? "Le service a récupéré et fonctionne normalement"
          : "Le service ne répond pas ou rencontre une erreur";

        await discordService.sendServiceStatusNotification(status, details);

        // Mettre à jour l'état courant
        this.isCurrentlyHealthy = isHealthy;
      }
    } catch (error) {
      logger.error("Error during health check:", error);

      // Si une erreur se produit pendant la vérification, considérer le service comme DOWN
      if (this.isCurrentlyHealthy) {
        await discordService.sendServiceStatusNotification(
          "DOWN",
          "Erreur lors de la vérification de santé du service"
        );
        this.isCurrentlyHealthy = false;
      }
    }
  }

  /**
   * Effectue une vérification manuelle et immédiate
   * @returns Résultat de la vérification de santé
   */
  async performCheck(): Promise<boolean> {
    try {
      const isHealthy = await this.healthCheckFn();
      logger.info(`Manual health check result: ${isHealthy ? "UP" : "DOWN"}`);
      return isHealthy;
    } catch (error) {
      logger.error("Error during manual health check:", error);
      return false;
    }
  }
}
