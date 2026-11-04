import { mkdir, rm } from "node:fs/promises";
import { simpleGit } from "simple-git";
import { DeploymentStep } from "../constants/deployment-step.enum";
import { DeploymentError } from "../utils/deployment-error";

const githubRepositoryUrlPattern =
  /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;

const commitShaPattern = /^[0-9a-f]{40}$/;

const redact = (text: string, secret: string): string =>
  text.split(secret).join("***");

const toAuthenticatedUrl = (repositoryUrl: string, token: string): string => {
  const match = githubRepositoryUrlPattern.exec(repositoryUrl);

  if (!match) {
    throw new DeploymentError(
      DeploymentStep.CLONE,
      "repository url is not a valid github repository url",
    );
  }

  return `https://x-access-token:${encodeURIComponent(token)}@github.com/${match[1]}/${match[2]}.git`;
};

const ambientEnvWithoutGitVars = (): NodeJS.ProcessEnv =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.toUpperCase().startsWith("GIT_"),
    ),
  );

const createGit = (baseDir?: string) =>
  simpleGit({
    ...(baseDir ? { baseDir } : {}),
    timeout: { block: 5 * 60 * 1000 },
    allowEnvironment: ["GIT_TERMINAL_PROMPT"],
  }).env({ ...ambientEnvWithoutGitVars(), GIT_TERMINAL_PROMPT: "0" });

export abstract class CloneService {
  static async clone(params: {
    repositoryUrl: string;
    branch: string;
    commitSha?: string | null;
    token: string;
    destination: string;
  }): Promise<string> {
    const { repositoryUrl, branch, commitSha, token, destination } = params;
    const authenticatedUrl = toAuthenticatedUrl(repositoryUrl, token);
    const target = commitSha ? `commit "${commitSha}"` : `branch "${branch}"`;

    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });

    try {
      if (commitSha) {
        if (!commitShaPattern.test(commitSha)) {
          throw new Error(`invalid commit sha "${commitSha}"`);
        }

        const git = createGit(destination);
        await git.init();
        await git.fetch([
          "--depth",
          "1",
          "--no-tags",
          authenticatedUrl,
          commitSha,
        ]);
        await git.checkout(["--detach", "FETCH_HEAD"]);
      } else {
        await createGit().clone(authenticatedUrl, destination, [
          "--depth",
          "1",
          "--single-branch",
          "--branch",
          branch,
        ]);
      }

      const checkedOutSha = (
        await simpleGit(destination).revparse(["HEAD"])
      ).trim();

      if (!commitShaPattern.test(checkedOutSha)) {
        throw new Error(`unexpected commit sha "${checkedOutSha}"`);
      }

      if (commitSha && checkedOutSha !== commitSha) {
        throw new Error(
          `checked out "${checkedOutSha}" instead of "${commitSha}"`,
        );
      }

      return checkedOutSha;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new DeploymentError(
        DeploymentStep.CLONE,
        `failed to clone ${target}: ${redact(redact(reason, encodeURIComponent(token)), token)}`,
      );
    }
  }
}
