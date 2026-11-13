import type {
    GitHubRepository,
    GitHubCommit,
    GitHubRelease,
    GitHubPullRequest
} from "../integrations/github.js";

interface HistoryEvent {
    id: string;
    type: string;
    title: string;
    description: string | null;
    date: string | null;
    dateMeaning: string;
    author: string | null;
    url: string | null;
}

export function buildHistory(
    repository: GitHubRepository,
    commits: GitHubCommit[],
    releases: GitHubRelease[],
    pullRequests: GitHubPullRequest[]
) {
    const events: HistoryEvent[] = [];

    events.push({
        id: `repository-${repository.full_name}`,
        type: "repository_created",
        title: "Repositório criado",
        description: repository.description,
        date: repository.created_at,
        dateMeaning: "repository_creation",
        author: repository.owner.login,
        url: repository.html_url
    });

    for (const commit of commits) {
        events.push({
            id: commit.sha,
            type: "commit",
            title: commit.commit.message.split("\n")[0],
            description: commit.commit.message,
            date: commit.commit.author?.date ?? null,
            dateMeaning: "commit_author_date",
            author: commit.author?.login ?? commit.commit.author?.name ?? null,
            url: commit.html_url
        });
    }

    for (const release of releases) {
        events.push({
            id: `release-${release.id}`,
            type: "release",
            title: release.name ?? release.tag_name,
            description: release.body,
            date: release.published_at,
            dateMeaning: "release_publication",
            author: release.author?.login ?? null,
            url: release.html_url
        });
    }

    for (const pullRequest of pullRequests) {
        events.push({
            id: `pull-${pullRequest.id}-created`,
            type: "pull_request_created",
            title: pullRequest.title,
            description: pullRequest.body,
            date: pullRequest.created_at,
            dateMeaning: "pull_request_creation",
            author: pullRequest.user?.login ?? null,
            url: pullRequest.html_url
        });

        if (pullRequest.merged_at) {
            events.push({
                id: `pull-${pullRequest.id}-merged`,
                type: "pull_request_merged",
                title: `Pull request integrada: ${pullRequest.title}`,
                description: null,
                date: pullRequest.merged_at,
                dateMeaning: "pull_request_merge",
                author: pullRequest.user?.login ?? null,
                url: pullRequest.html_url
            });
        } else if (pullRequest.closed_at) {
            events.push({
                id: `pull-${pullRequest.id}-closed`,
                type: "pull_request_closed",
                title: `Pull request fechada: ${pullRequest.title}`,
                description: null,
                date: pullRequest.closed_at,
                dateMeaning: "pull_request_closure",
                author: pullRequest.user?.login ?? null,
                url: pullRequest.html_url
            });
        }
    }

    events.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;

        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return {
        repository: {
            name: repository.full_name,
            description: repository.description,
            createdAt: repository.created_at,
            url: repository.html_url
        },
        summary: {
            commits: commits.length,
            releases: releases.length,
            pullRequests: pullRequests.length,
            events: events.length
        },
        events,
        coverage: {
            limitPerCategory: 1000,
            note: "A reconstrução considera os registros recuperados pela API do GitHub. Ela não garante cobertura integral do histórico."
        }
    };
}