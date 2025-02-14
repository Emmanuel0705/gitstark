import { Octokit } from "@octokit/rest";
import { GitHubConfig } from "../environment"; // Import the GitHubConfig type from your environment validation

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(private githubToken: string, repository: string) {
    // Initialize the Octokit client with the GitHub token
    this.octokit = new Octokit({
      auth: this.githubToken,
      baseUrl: "https://api.github.com",
    });

    console.log({ repository, githubToken });

    // Parse the repository into owner and repo name
    const [owner, repo] = repository?.split("/");
    if (!owner || !repo) {
      throw new Error("Invalid repository format. Expected 'owner/repo'.");
    }

    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Create a GitHub issue in the specified repository.
   * @param title - The title of the issue.
   * @param body - The body/description of the issue.
   * @param labels - Optional labels to add to the issue.
   * @returns The created issue's URL.
   */
  async createIssue(
    title?: string,
    body?: string,
    labels: string[] = []
  ): Promise<string> {
    try {
      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        labels,
      });

      if (!response.data.html_url) {
        throw new Error("Failed to create issue: No URL returned.");
      }

      return response.data.html_url;
    } catch (error) {
      throw new Error(`Failed to create GitHub issue: ${error.message}`);
    }
  }

  /**
   * Get details of a specific issue by issue number.
   * @param issueNumber - The number of the issue.
   * @returns The issue details.
   */
  async getIssue(issueNumber: number): Promise<any> {
    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch GitHub issue: ${error.message}`);
    }
  }

  async listOpenPullRequests(): Promise<
    {
      number: number;
      title: string;
      author: string;
      createdAt: string;
      url: string;
    }[]
  > {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: "open",
        sort: "created",
        direction: "desc",
      });

      return response.data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        author: pr.user?.login || "unknown",
        createdAt: pr.created_at,
        url: pr.html_url,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  /**
   * Close a specific issue by issue number.
   * @param issueNumber - The number of the issue to close.
   * @returns The updated issue details.
   */
  async closeIssue(issueNumber: number): Promise<any> {
    try {
      const response = await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        state: "closed",
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to close GitHub issue: ${error.message}`);
    }
  }

  /**
   * Create a comment on a pull request
   * @param pullNumber - The number of the pull request
   * @param comment - The comment text
   * @returns The URL of the created comment
   */
  async createPRComment(pullNumber: number, comment: string): Promise<string> {
    try {
      const response = await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: pullNumber, // PR comments use the issues API
        body: comment,
      });

      if (!response.data.html_url) {
        throw new Error("Failed to create comment: No URL returned.");
      }

      return response.data.html_url;
    } catch (error) {
      throw new Error(`Failed to create PR comment: ${error.message}`);
    }
  }
  /**
   * Check if a pull request is mergeable
   * @param pullNumber - The number of the pull request
   * @returns Object containing mergeable status and reason if not mergeable
   */
  async checkPRMergeable(pullNumber: number): Promise<{
    mergeable: boolean;
    reason?: string;
    body?: string;
  }> {
    try {
      const response = await this.octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
      });

      if (!response.data.mergeable) {
        return {
          body: response.data.body,
          mergeable: false,
          reason: "Pull request has conflicts that must be resolved",
        };
      }

      if (response.data.mergeable_state === "blocked") {
        return {
          mergeable: false,
          body: response.data.body,
          reason: "Required checks or reviews are pending",
        };
      }

      return { mergeable: true, body: response.data.body };
    } catch (error) {
      throw new Error(`Failed to check PR mergeability: ${error.message}`);
    }
  }

  /**
   * Merge a pull request
   * @param pullNumber - The number of the pull request
   * @param mergeMethod - The merge method to use (merge, squash, or rebase)
   * @param commitMessage - Optional custom commit message
   * @returns The merge result including SHA of the merge commit
   */
  async mergePR(
    pullNumber: number,
    mergeMethod: "merge" | "squash" | "rebase" = "merge",
    commitMessage?: string
  ): Promise<{ sha: string; message: string }> {
    try {
      const response = await this.octokit.rest.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
        merge_method: mergeMethod,
        commit_message: commitMessage,
      });

      return {
        sha: response.data.sha,
        message: response.data.message,
      };
    } catch (error) {
      throw new Error(`Failed to merge PR: ${error.message}`);
    }
  }

  async getPRChangesAsString(pullNumber: number): Promise<string> {
    try {
      // Get the PR diff using the compare API
      const pr = await this.octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
      });

      // Get the files changed in the PR
      const files = await this.octokit.rest.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
      });

      let changesSummary = `Pull Request #${pullNumber}: ${pr.data.title}\n`;
      changesSummary += `State: ${pr.data.state}\n`;
      changesSummary += `Changed Files: ${files.data.length}\n\n`;

      // Process each changed file
      for (const file of files.data) {
        changesSummary += `\nFile: ${file.filename}\n`;
        changesSummary += `Status: ${file.status}\n`;
        changesSummary += `Changes: +${file.additions} -${file.deletions}\n`;

        // Add the patch if available
        if (file.patch) {
          changesSummary += "Diff:\n";
          changesSummary += file.patch
            .split("\n")
            .map((line) => `  ${line}`) // Indent diff lines
            .join("\n");
          changesSummary += "\n";
        }
      }

      return changesSummary;
    } catch (error) {
      throw new Error(`Failed to get PR changes: ${error.message}`);
    }
  }
}
