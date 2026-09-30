import type { Express } from 'express';

import type { CoreServicesManager } from './adapters/core-services.js';

export type MCPHealthStatus = Awaited<ReturnType<CoreServicesManager['getHealthStatus']>>;
type HealthStatusProvider = Pick<CoreServicesManager, 'getHealthStatus'>;

function isHealthyStatus(healthStatus: MCPHealthStatus): boolean {
  return healthStatus.initialized && Object.values(healthStatus.services).every(Boolean);
}

export function buildHealthzResponse(healthStatus: MCPHealthStatus): {
  statusCode: number;
  body: MCPHealthStatus;
} {
  return {
    statusCode: isHealthyStatus(healthStatus) ? 200 : 503,
    body: healthStatus
  };
}

export function registerHealthzRoute(app: Express, healthProvider: HealthStatusProvider): void {
  app.get('/healthz', async (_req, res) => {
    try {
      const healthStatus = await healthProvider.getHealthStatus();
      const { statusCode, body } = buildHealthzResponse(healthStatus);
      res.status(statusCode).json(body);
    } catch (error) {
      res.status(503).json({
        initialized: false,
        services: {},
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  });
}
