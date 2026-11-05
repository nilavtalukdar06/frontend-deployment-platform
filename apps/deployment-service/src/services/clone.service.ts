import { mkdir, rm } from "node:fs/promises";
import { simpleGit } from "simple-git";
import { DeploymentStep } from "../constants/deployment-step.enum";
import type { DeploymentLogCollector } from "../logging/deployment-log-collector";
import { DeploymentError } from "../utils/deployment-error";
import { formatDuration } from "../utils/format-duration";

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
    collector: DeploymentLogCollector;
  }): Promise<string> {
    const { repositoryUrl, branch, commitSha, token, destination, collector } =
      params;
    const note = (message: string) =>
      collector.log("info", DeploymentStep.CLONE, message);
    const authenticatedUrl = toAuthenticatedUrl(repositoryUrl, token);
    const target = commitSha ? `commit "${commitSha}"` : `branch "${branch}"`;

    note(
      "Repository URL validated. Authenticating with the GitHub access token",
    );
    note("Preparing a clean workspace for the repository");
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    const startedAt = Date.now();

    try {
      if (commitSha) {
        if (!commitShaPattern.test(commitSha)) {
          throw new Error(`invalid commit sha "${commitSha}"`);
        }

        const git = createGit(destination);
        note(`Initializing an empty repository to fetch commit ${commitSha}`);
        await git.init();
        note("Fetching the commit with a shallow history (depth 1)");
        await git.fetch([
          "--depth",
          "1",
          "--no-tags",
          authenticatedUrl,
          commitSha,
        ]);
        note("Fetch complete. Checking out the commit");
        await git.checkout(["--detach", "FETCH_HEAD"]);
      } else {
        note(
          `Downloading branch "${branch}" with a shallow, single-branch clone (depth 1)`,
        );
        await createGit().clone(authenticatedUrl, destination, [
          "--depth",
          "1",
          "--single-branch",
          "--branch",
          branch,
        ]);
      }

      note(
        `Download complete in ${formatDuration(Date.now() - startedAt)}. Verifying the checked out commit`,
      );

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

      note("Checked out commit verified");

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
