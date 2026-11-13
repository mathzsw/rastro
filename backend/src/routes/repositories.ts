import { Router } from "express";
import { getRepository, parseRepositoryUrl } from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);
        const data = await getRepository(owner, repository);

        return res.status(200).json({
            name: data.name,
            fullName: data.full_name,
            description: data.description,
            url: data.html_url,
            language: data.language,
            stars: data.stargazers_count,
            forks: data.forks_count,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            owner: {
                login: data.owner.login,
                avatar: data.owner.avatar_url
            }
        });
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;