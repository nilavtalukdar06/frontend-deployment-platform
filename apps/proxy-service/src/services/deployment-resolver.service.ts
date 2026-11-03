import { env } from "../config/env";
import { DeploymentRepository } from "../repositories/deployment.repository";

const deploymentIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const projectSlugPattern = /^[a-z]+-[a-z]+$/;

const maxCachedLabels = 10_000;

type CachedResolution = { deploymentId: string | null; expiresAt: number };

const cache = new Map<string, CachedResolution>();

const lookup = (label: string): Promise<string | null> => {
  if (deploymentIdPattern.test(label)) {
    return DeploymentRepository.findReadyDeploymentId(label);
  }

  if (projectSlugPattern.test(label)) {
    return DeploymentRepository.findLatestReadyDeploymentIdBySlug(label);
  }

  return Promise.resolve(null);
};

export abstract class DeploymentResolverService {
  static async resolve(label: string): Promise<string | null> {
    const now = Date.now();
    const cached = cache.get(label);

    if (cached && cached.expiresAt > now) {
      return cached.deploymentId;
    }

    const deploymentId = await lookup(label);

    if (env.DEPLOYMENT_CACHE_TTL_MS > 0) {
      if (cache.size >= maxCachedLabels) {
        cache.clear();
      }
      cache.set(label, {
        deploymentId,
        expiresAt: now + env.DEPLOYMENT_CACHE_TTL_MS,
      });
    }

    return deploymentId;
  }
}
