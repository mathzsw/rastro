import type {
  GitHubRepository,
  GitHubCommit,
  GitHubRelease,
  GitHubPullRequest,
} from "../integrations/github.js";

export interface HistoryEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string | null;
  dateMeaning: string;
  author: string | null;
  url: string | null;
}

export interface HistoryMilestone {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string | null;
  author: string | null;
  url: string | null;
}

function getTimestamp(date: string | null | undefined) {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function findOldest<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
): T | undefined {
  return items
    .filter((item) => getTimestamp(getDate(item)) !== null)
    .sort(
      (a, b) =>
        (getTimestamp(getDate(a)) ?? 0) -
        (getTimestamp(getDate(b)) ?? 0),
    )[0];
}

export function buildHistory(
  repository: GitHubRepository,
  commits: GitHubCommit[],
  releases: GitHubRelease[],
  pullRequests: GitHubPullRequest[],
) {
  const events: HistoryEvent[] = [
    {
      id: "repository-" + repository.full_name,
      type: "repository_created",
      title: "Repositório criado",
      description: repository.description,
      date: repository.created_at,
      dateMeaning: "repository_creation",
      author: repository.owner.login,
      url: repository.html_url,
    },
  ];

  for (const commit of commits) {
    events.push({
      id: commit.sha,
      type: "commit",
      title: commit.commit.message.split("\n")[0] || "Commit sem mensagem",
      description: commit.commit.message,
      date: commit.commit.author?.date ?? null,
      dateMeaning: "commit_author_date",
      author: commit.author?.login ?? commit.commit.author?.name ?? null,
      url: commit.html_url,
    });
  }

  for (const release of releases) {
    events.push({
      id: "release-" + release.id,
      type: "release",
      title: release.name ?? release.tag_name,
      description: release.body,
      date: release.published_at,
      dateMeaning: "release_publication",
      author: release.author?.login ?? null,
      url: release.html_url,
    });
  }

  for (const pullRequest of pullRequests) {
    events.push({
      id: "pull-" + pullRequest.id + "-created",
      type: "pull_request_created",
      title: pullRequest.title,
      description: pullRequest.body,
      date: pullRequest.created_at,
      dateMeaning: "pull_request_creation",
      author: pullRequest.user?.login ?? null,
      url: pullRequest.html_url,
    });

    if (pullRequest.merged_at) {
      events.push({
        id: "pull-" + pullRequest.id + "-merged",
        type: "pull_request_merged",
        title: "Pull request integrada: " + pullRequest.title,
        description: null,
        date: pullRequest.merged_at,
        dateMeaning: "pull_request_merge",
        author: pullRequest.user?.login ?? null,
        url: pullRequest.html_url,
      });
    } else if (pullRequest.closed_at) {
      events.push({
        id: "pull-" + pullRequest.id + "-closed",
        type: "pull_request_closed",
        title: "Pull request fechada: " + pullRequest.title,
        description: null,
        date: pullRequest.closed_at,
        dateMeaning: "pull_request_closure",
        author: pullRequest.user?.login ?? null,
        url: pullRequest.html_url,
      });
    }
  }

  events.sort((a, b) => {
    const aTime = getTimestamp(a.date);
    const bTime = getTimestamp(b.date);
    if (aTime === null && bTime === null) return 0;
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return aTime - bTime;
  });

  const milestones: HistoryMilestone[] = [
    {
      id: "repository-created",
      type: "repository_created",
      title: "Repositório criado",
      description: "Data de criação registrada pelo GitHub.",
      date: repository.created_at,
      author: repository.owner.login,
      url: repository.html_url,
    },
  ];

  const firstCommit = findOldest(
    commits,
    (commit) => commit.commit.author?.date,
  );
  if (firstCommit) {
    milestones.push({
      id: "first-commit",
      type: "first_commit_found",
      title: "Primeiro commit encontrado",
      description:
        firstCommit.commit.message.split("\n")[0] || "Commit sem mensagem",
      date: firstCommit.commit.author?.date ?? null,
      author:
        firstCommit.author?.login ??
        firstCommit.commit.author?.name ??
        null,
      url: firstCommit.html_url,
    });
  }

  const firstExternalCommit = findOldest(
    commits.filter((commit) => {
      const login = commit.author?.login;
      return Boolean(
        login &&
          login.toLowerCase() !== repository.owner.login.toLowerCase(),
      );
    }),
    (commit) => commit.commit.author?.date,
  );
  if (firstExternalCommit) {
    milestones.push({
      id: "first-external-contribution",
      type: "first_external_contribution",
      title: "Primeira contribuição de outro perfil",
      description:
        "Primeiro commit recuperado cujo perfil associado é diferente do proprietário do repositório.",
      date: firstExternalCommit.commit.author?.date ?? null,
      author: firstExternalCommit.author?.login ?? null,
      url: firstExternalCommit.html_url,
    });
  }

  const firstRelease = findOldest(
    releases,
    (release) => release.published_at,
  );
  if (firstRelease) {
    milestones.push({
      id: "first-release",
      type: "first_release_found",
      title: "Primeira versão publicada",
      description: firstRelease.name ?? firstRelease.tag_name,
      date: firstRelease.published_at,
      author: firstRelease.author?.login ?? null,
      url: firstRelease.html_url,
    });
  }

  const firstPullRequest = findOldest(
    pullRequests,
    (pullRequest) => pullRequest.created_at,
  );
  if (firstPullRequest) {
    milestones.push({
      id: "first-pull-request",
      type: "first_pull_request_found",
      title: "Primeira pull request encontrada",
      description: firstPullRequest.title,
      date: firstPullRequest.created_at,
      author: firstPullRequest.user?.login ?? null,
      url: firstPullRequest.html_url,
    });
  }

  const firstMergedPullRequest = findOldest(
    pullRequests.filter((pullRequest) => Boolean(pullRequest.merged_at)),
    (pullRequest) => pullRequest.merged_at,
  );
  if (firstMergedPullRequest) {
    milestones.push({
      id: "first-merged-pull-request",
      type: "first_merge_found",
      title: "Primeira pull request integrada",
      description: firstMergedPullRequest.title,
      date: firstMergedPullRequest.merged_at,
      author: firstMergedPullRequest.user?.login ?? null,
      url: firstMergedPullRequest.html_url,
    });
  }

  if (commits.length >= 2) {
    const monthlyCounts = new Map<string, number>();
    for (const commit of commits) {
      const date = commit.commit.author?.date;
      if (!date || getTimestamp(date) === null) continue;
      const month = date.slice(0, 7);
      monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
    }

    const mostActiveMonth = [...monthlyCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0];

    if (mostActiveMonth) {
      const [month, count] = mostActiveMonth;
      milestones.push({
        id: "most-active-month-" + month,
        type: "most_active_month",
        title: "Mês com mais commits",
        description:
          count +
          " commits foram registrados neste mês entre os dados recuperados.",
        date: month + "-01T00:00:00.000Z",
        author: null,
        url: null,
      });
    }
  }

  milestones.sort((a, b) => {
    const aTime = getTimestamp(a.date);
    const bTime = getTimestamp(b.date);
    if (aTime === null && bTime === null) return 0;
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return aTime - bTime;
  });

  const authors = new Set<string>();
  for (const commit of commits) {
    const author =
      commit.author?.login ?? commit.commit.author?.name;
    if (author?.trim()) authors.add(author.trim().toLowerCase());
  }
  for (const release of releases) {
    if (release.author?.login) {
      authors.add(release.author.login.toLowerCase());
    }
  }
  for (const pullRequest of pullRequests) {
    if (pullRequest.user?.login) {
      authors.add(pullRequest.user.login.toLowerCase());
    }
  }

  return {
    repository: {
      name: repository.full_name,
      description: repository.description,
      createdAt: repository.created_at,
      url: repository.html_url,
    },
    summary: {
      commits: commits.length,
      releases: releases.length,
      pullRequests: pullRequests.length,
      events: events.length,
      contributors: authors.size,
      milestones: milestones.length,
    },
    milestones,
    events,
    coverage: {
      limitPerCategory: 1000,
      note:
        "A reconstrução considera os registros recuperados pela API do GitHub. " +
        "Datas de commits usam a data informada pelo autor; eventos de pull request usam " +
        "suas datas de abertura, integração ou fechamento. Os marcos descrevem apenas " +
        "os dados recuperados e não garantem cobertura integral da história do repositório.",
    },
  };
}
