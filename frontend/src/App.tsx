import { useState, type FormEvent } from "react";
import {
  getHistory,
  type HistoryResponse,
  type HistoryEvent,
} from "./services/historyService";
import "./App.css";

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repositoryUrl.trim()) {
      setError("Informe a URL de um repositório.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHistory(null);

      const data = await getHistory(repositoryUrl.trim());
      setHistory(data);
    } catch (err: unknown) {
        console.error("Erro ao buscar histórico:", err);
        
        setError(
            err instanceof Error
            ? err.message
            : "Erro desconhecido ao reconstruir o histórico."
        );} finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Data não disponível";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsedDate);
  }

  function getCategory(type: string) {
    if (type === "repository_created") return "origin";
    if (type === "commit") return "development";
    if (type.includes("release")) return "releases";
    if (type.includes("pull_request")) return "collaboration";

    return "other";
  }

  const chapters = [
    {
      id: "origin",
      number: "01",
      title: "A origem",
      description: "O nascimento e a criação do repositório.",
    },
    {
      id: "development",
      number: "02",
      title: "O desenvolvimento",
      description: "Os registros que mostram a evolução do código.",
    },
    {
      id: "releases",
      number: "03",
      title: "As publicações",
      description: "Versões e lançamentos registrados no projeto.",
    },
    {
      id: "collaboration",
      number: "04",
      title: "A colaboração",
      description: "A participação e as contribuições registradas.",
    },
    {
      id: "other",
      number: "05",
      title: "Outros acontecimentos",
      description: "Demais registros encontrados no histórico.",
    },
  ];

  function getEventContext(event: HistoryEvent) {
    switch (event.type) {
      case "repository_created":
        return "Este registro marca a criação do repositório.";

      case "commit":
        return "Uma alteração foi registrada no histórico de desenvolvimento.";

      case "release":
        return "Uma nova versão foi registrada no projeto.";

      default:
        if (event.type.includes("pull_request")) {
          return "Uma atividade de colaboração foi registrada.";
        }

        return "Este acontecimento faz parte do histórico recuperado.";
    }
  }

  return (
    <main className="app">
      <header className="header">
        <a className="logo" href="/">
          <span className="logo-mark">
            <span className="logo-line"></span>
            <span className="logo-dot"></span>
            <span className="logo-dot"></span>
            <span className="logo-dot"></span>
          </span>

          <span className="logo-text">
            RASTRO<span>.</span>
          </span>
        </a>

        <span className="header-label">GITHUB HISTORY EXPLORER</span>
      </header>

      <section className="hero">
        <span className="eyebrow">EVERY CODE HAS A STORY.</span>

        <h1>
          Todo projeto deixa
          <br />
          <span>um rastro.</span>
        </h1>

        <p className="hero-description">
          Explore a história por trás de qualquer repositório.
          Reconstrua sua evolução, descubra seus marcos e acompanhe
          cada etapa do desenvolvimento.
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>

          <input
            type="url"
            placeholder="https://github.com/usuario/repositorio"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Reconstruindo..." : "Explorar →"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {history && (
          <section className="history">
            <div className="history-intro">
              <span className="eyebrow">DOCUMENTÁRIO DO PROJETO</span>

              <h2>{history.repository.name}</h2>

              <p>
                {history.repository.description ||
                  "Este repositório não possui uma descrição cadastrada."}
              </p>

              <a
                className="history-source"
                href={history.repository.url}
                target="_blank"
                rel="noreferrer"
              >
                Acessar repositório original ↗
              </a>
            </div>

            <div className="history-summary">
              <div className="summary-item">
                <strong>{history.summary.events}</strong>
                <span>ACONTECIMENTOS</span>
              </div>

              <div className="summary-item">
                <strong>{history.summary.commits}</strong>
                <span>COMMITS</span>
              </div>

              <div className="summary-item">
                <strong>{history.summary.releases}</strong>
                <span>RELEASES</span>
              </div>

              <div className="summary-item">
                <strong>{history.summary.pullRequests}</strong>
                <span>PULL REQUESTS</span>
              </div>
            </div>

            <div className="history-chapters">
              <div className="chapters-heading">
                <span className="eyebrow">A TRAJETÓRIA</span>
                <h2>A história até aqui.</h2>
                <p>
                  Uma reconstrução baseada nos registros disponíveis
                  do GitHub.
                </p>
              </div>

              {chapters.map((chapter) => {
                const events = history.events.filter(
                  (event) => getCategory(event.type) === chapter.id
                );

                if (events.length === 0) return null;

                return (
                  <section className="history-chapter" key={chapter.id}>
                    <div className="chapter-heading">
                      <span className="chapter-number">
                        {chapter.number}
                      </span>

                      <div>
                        <h3>{chapter.title}</h3>
                        <p>{chapter.description}</p>
                      </div>

                      <span className="chapter-count">
                        {events.length}
                      </span>
                    </div>

                    <div className="history-events">
                      {events.map((event) => (
                        <article className="history-event" key={event.id}>
                          <div className="event-marker"></div>

                          <div className="event-content">
                            <span className="event-date">
                              {formatDate(event.date)}
                            </span>

                            <h4>{event.title}</h4>

                            <p className="event-description">
                              {event.description}
                            </p>

                            <p className="event-context">
                              {getEventContext(event)}
                            </p>

                            <div className="event-footer">
                              <span>
                                {event.author || "Autor não identificado"}
                              </span>

                              <a
                                href={event.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Consultar registro ↗
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="history-coverage">
              <span className="eyebrow">TRANSPARÊNCIA HISTÓRICA</span>

              <h3>Sobre esta reconstrução</h3>

              <p>{history.coverage.note}</p>

              <span>
                Limite de consulta: {history.coverage.limitPerCategory}{" "}
                registros por categoria.
              </span>
            </div>
          </section>
        )}

        <span className="search-hint">
          EXPLORE REPOSITÓRIOS PÚBLICOS DO GITHUB
        </span>
      </section>

      <footer className="footer">
        <span>RASTRO © 2026</span>
        <span>EVERY CODE HAS A STORY.</span>
      </footer>
    </main>
  );
}

export default App;