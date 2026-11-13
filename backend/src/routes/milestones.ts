import { Router } from "express";
import {
    getRepository,
    getCommits,
    getReleases,
    getPullRequests,
    parseRepositoryUrl
} from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);

        const [repo, commits, releases, pullRequests] = await Promise.all([
            getRepository(owner, repository),
            getCommits(owner, repository),
            getReleases(owner, repository),
            getPullRequests(owner, repository)
        ]);

        const milestones = [];

        milestones.push({
            type: "repository_created",
            title: "Repositório criado",
            date: repo.created_at,
            description: "Data de criação do repositório no GitHub."
        });

        if (commits.length > 0) {
            const oldestCommit = commits.reduce((oldest, current) =>
                new Date(current.commit.author?.date ?? Infinity).getTime() <
                new Date(oldest.commit.author?.date ?? Infinity).getTime()
                    ? current
                    : oldest
            );

            milestones.push({
                type: "oldest_commit_found",
                title: "Commit mais antigo encontrado",
                date: oldestCommit.commit.author?.date ?? null,
                description: oldestCommit.commit.message,
                url: oldestCommit.html_url
            });
        }

        if (releases.length > 0) {
            const firstRelease = releases.reduce((oldest, current) =>
                new Date(current.published_at ?? Infinity).getTime() <
                new Date(oldest.published_at ?? Infinity).getTime()
                    ? current
                    : oldest
            );

            milestones.push({
                type: "first_release_found",
                title: "Release mais antiga encontrada",
                date: firstRelease.published_at,
                description: firstRelease.name ?? firstRelease.tag_name,
                url: firstRelease.html_url
            });
        }

        if (pullRequests.length > 0) {
            const firstPullRequest = pullRequests.reduce((oldest, current) =>
                new Date(current.created_at).getTime() <
                new Date(oldest.created_at).getTime()
                    ? current
                    : oldest
            );

            milestones.push({
                type: "first_pull_request_found",
                title: "Pull request mais antiga encontrada",
                date: firstPullRequest.created_at,
                description: firstPullRequest.title,
                url: firstPullRequest.html_url
            });
        }

        milestones.sort((a, b) =>
            new Date(a.date ?? 0).getTime() -
            new Date(b.date ?? 0).getTime()
        );

        return res.status(200).json({
            repository: repo.full_name,
            milestones,
            coverage: {
                commitsAnalyzed: commits.length,
                releasesAnalyzed: releases.length,
                pullRequestsAnalyzed: pullRequests.length,
                limitPerCategory: 1000,
                note: "Os marcos representam os registros encontrados na amostra consultada, não necessariamente toda a história do repositório."
            }
        });
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;