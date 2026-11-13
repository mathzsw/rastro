import { Router } from "express";
import { parseRepositoryUrl } from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repository}/contributors?per_page=100`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    "User-Agent": "RASTRO"
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Não foi possível buscar os colaboradores."
            });
        }

        const contributors = await response.json();

        return res.status(200).json(
            contributors.map((item: any) => ({
                username: item.login,
                avatar: item.avatar_url,
                profile: item.html_url,
                contributions: item.contributions
            }))
        );
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;