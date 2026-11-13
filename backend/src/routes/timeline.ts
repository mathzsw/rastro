import { Router } from "express";
import {
    getCommits,
    getReleases,
    getPullRequests,
    parseRepositoryUrl
} from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);

        const [commits, releases, pullRequests] = await Promise.all([
            getCommits(owner, repository),
            getReleases(owner, repository),
            getPullRequests(owner, repository)
        ]);

        const timeline = [
            ...commits.map((item) => ({
                id: item.sha,
                type: "commit",
                title: item.commit.message.split("\n")[0],
                description: item.commit.message,
                date: item.commit.author?.date ?? null,
                author: item.author?.login ?? item.commit.author?.name ?? null,
                url: item.html_url
            })),

            ...releases.map((item) => ({
                id: String(item.id),
                type: "release",
                title: item.name ?? item.tag_name,
                description: item.body,
                date: item.published_at,
                author: item.author?.login ?? null,
                url: item.html_url
            })),

            ...pullRequests.map((item) => ({
                id: String(item.id),
                type: "pull_request",
                title: item.title,
                description: item.body,
                date: item.merged_at ?? item.closed_at ?? item.created_at,
                author: item.user?.login ?? null,
                url: item.html_url
            }))
        ];

        timeline.sort((a, b) => {
            return new Date(b.date ?? 0).getTime() -
                new Date(a.date ?? 0).getTime();
        });

        return res.status(200).json(timeline);
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;