import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "online",
        project: "RASTRO"
    });
});

app.get("/api/repositories", async (req, res) => {
    try {
        const repositoryUrl = req.query.url;

        if (typeof repositoryUrl !== "string") {
            return res.status(400).json({
                error: "Informe a URL de um repositório."
            });
        }

        const url = new URL(repositoryUrl);

        if (url.hostname !== "github.com") {
            return res.status(400).json({
                error: "Informe uma URL válida do GitHub."
            });
        }

        const [owner, repository] = url.pathname
            .replace(/\/+$/, "")
            .split("/")
            .filter(Boolean);

        if (!owner || !repository) {
            return res.status(400).json({
                error: "URL de repositório incompleta."
            });
        }

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repository.replace(/\.git$/, "")}`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    "User-Agent": "RASTRO"
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Não foi possível encontrar o repositório."
            });
        }

        const data = await response.json();

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

    } catch {
        return res.status(400).json({
            error: "URL inválida ou erro na comunicação com o GitHub."
        });
    }
});

app.listen(PORT, () => {
    console.log(`RASTRO API running at http://localhost:${PORT}`);
});