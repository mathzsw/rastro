
const GITHUB_API = "https://api.github.com";

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export interface GitHubRelease {
  id: number;
  name: string | null;
  tag_name: string;
  body: string | null;
  html_url: string;
  created_at: string;
  published_at: string | null;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export function parseRepositoryUrl(url: string) {
  try {
    const parsedUrl = new URL(url.trim());

    if (
      parsedUrl.hostname !== "github.com" &&
      parsedUrl.hostname !== "www.github.com"
    ) {
      return null;
    }

    const parts = parsedUrl.pathname
      .split("/")
      .filter(Boolean);

    if (parts.length !== 2) {
      return null;
    }

    const owner = parts[0];
    const repository = parts[1]
      .replace(/\.git$/, "");

    if (!owner || !repository) {
      return null;
    }

    return { owner, repository };
  } catch {
    return null;
  }
}

async function fetchGitHub<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repositório ou recurso não encontrado.");
    }

    if (response.status === 403 || response.status === 429) {
      throw new Error(
        "Limite de requisições da API do GitHub atingido. Tente novamente mais tarde."
      );
    }

    throw new Error(
      `Erro ao consultar o GitHub: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const results: T[] = [];
  const perPage = 100;
  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    const separator = endpoint.includes("?") ? "&" : "?";

    const url =
      `${endpoint}${separator}per_page=${perPage}&page=${page}`;

    const data = await fetchGitHub<T[]>(url);

    results.push(...data);

    if (data.length < perPage) {
      break;
    }
  }

  return results;
}

export async function getRepository(
  owner: string,
  repository: string
): Promise<GitHubRepository> {
  const url =
    `${GITHUB_API}/repos/${owner}/${repository}`;

  return fetchGitHub<GitHubRepository>(url);
}

export async function getCommits(
  owner: string,
  repository: string
): Promise<GitHubCommit[]> {
  const url =
    `${GITHUB_API}/repos/${owner}/${repository}/commits`;

  return fetchAllPages<GitHubCommit>(url);
}

export async function getReleases(
  owner: string,
  repository: string
): Promise<GitHubRelease[]> {
  const url =
    `${GITHUB_API}/repos/${owner}/${repository}/releases`;

  return fetchAllPages<GitHubRelease>(url);
}

export async function getPullRequests(
  owner: string,
  repository: string
): Promise<GitHubPullRequest[]> {
  const url =
    `${GITHUB_API}/repos/${owner}/${repository}/pulls?state=all`;

  return fetchAllPages<GitHubPullRequest>(url);
}