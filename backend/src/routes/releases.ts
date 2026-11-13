import { Router } from "express";
import { getReleases, parseRepositoryUrl } from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);
        const releases = await getReleases(owner, repository);

        return res.status(200).json(
            releases.map((item) => ({
                id: item.id,
                name: item.name,
                tag: item.tag_name,
                description: item.body,
                publishedAt: item.published_at,
                url: item.html_url,
                author: item.author?.login ?? null,
                avatar: item.author?.avatar_url ?? null
            }))
        );
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;