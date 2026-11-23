import { useMemo, useState, type FormEvent } from "react";
import {
  getHistory,
  type HistoryResponse,
  type HistoryEvent,
} from "./services/historyService";
import "./App.css";

type ChapterId = "origin" | "development" | "releases" | "collaboration" | "other";
type CategoryFilter = "all" | Exclude<ChapterId, "origin">;
type SortOrder = "oldest" | "newest";

const INITIAL_EVENT_LIMIT = 3;
const INITIAL_MILESTONE_LIMIT = 4;

const chapters: {
  id: ChapterId;
  number: string;
  title: string;
  description: string;
  initialLimit: number;
}[] = [
  {
    id: "origin",
    number: "01",
    title: "A origem",
    description: "O nascimento e a criação do repositório.",
    initialLimit: Number.POSITIVE_INFINITY,
  },
  {
    id: "development",
    number: "02",
    title: "O desenvolvimento",
    description: "Os registros que mostram a evolução do código.",
    initialLimit: INITIAL_EVENT_LIMIT,
  },
  {
    id: "releases",
    number: "03",
    title: "As publicações",
    description: "Versões e lançamentos registrados no projeto.",
    initialLimit: INITIAL_EVENT_LIMIT,
  },
  {
    id: "collaboration",
    number: "04",
    title: "A colaboração",
    description: "A participação e as contribuições registradas.",
    initialLimit: INITIAL_EVENT_LIMIT,
  },
  {
    id: "other",
    number: "05",
    title: "Outros acontecimentos",
    description: "Demais registros encontrados no histórico.",
    initialLimit: INITIAL_EVENT_LIMIT,
  },
];

const filters: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "development", label: "Commits" },
  { value: "releases", label: "Releases" },
  { value: "collaboration", label: "Pull requests" },
  { value: "other", label: "Outros" },
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCategory(type: string): ChapterId {
  if (type === "repository_created") return "origin";
  if (type === "commit") return "development";
  if (type.includes("release")) return "releases";
  if (type.includes("pull_request")) return "collaboration";
  return "other";
}

function getCategoryLabel(type: string) {
  const category = getCategory(type);
  const labels: Record<ChapterId, string> = {
    origin: "Origem",
    development: "Commit",
    releases: "Release",
    collaboration: "Pull request",
    other: "Outro registro",
  };
  return labels[category];
}

function getEventContext(event: HistoryEvent) {
  switch (event.type) {
    case "repository_created":
      return "Este registro marca a criação do repositório.";
    case "commit":
      return "Uma alteração foi registrada no histórico de desenvolvimento.";
    case "release":
      return "Uma nova versão foi registrada no projeto.";
    case "pull_request_created":
      return "Uma pull request foi aberta no repositório.";
    case "pull_request_merged":
      return "O GitHub registra que esta pull request foi integrada.";
    case "pull_request_closed":
      return "O GitHub registra o fechamento desta pull request.";
    default:
      if (event.type.includes("pull_request")) {
        return "Uma atividade relacionada a pull request foi registrada.";
      }
      return "Este acontecimento faz parte do histórico recuperado.";
  }
}

function getDateMeaningLabel(dateMeaning?: string | null) {
  const meanings: Record<string, string> = {
    repository_creation: "Data de criação do repositório",
    commit_author_date: "Data informada pelo autor do commit",
    commit_committer_date: "Data de registro do commit",
    release_publication: "Data de publicação da versão",
    pull_request_creation: "Data de abertura da pull request",
    pull_request_merge: "Data de integração da pull request",
    pull_request_closure: "Data de fechamento da pull request",
    most_active_month: "Período de atividade agregado por mês",
  };

  return dateMeaning ? meanings[dateMeaning] ?? "Data do registro" : "Data do registro";
}

function formatDate(date?: string | null, includeTime = true) {
  if (!date) return "Data não disponível";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Data não disponível";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(parsedDate);
}

function getTimestamp(date?: string | null) {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function exportEventsToCsv(events: HistoryEvent[], repositoryName: string) {
  const columns = ["Data", "Tipo", "Título", "Descrição", "Autor", "Significado da data", "URL"];
  const escapeCell = (value: string | null | undefined) => {
    const text = String(value ?? "");
    const safeText = /^[\\s]*[=+\\-@]/.test(text) ? "'" + text : text;
    return '"' + safeText.replace(/"/g, '""') + '"';
  };

  const rows = events.map((event) => [
    event.date,
    getCategoryLabel(event.type),
    event.title,
    event.description,
    event.author,
    getDateMeaningLabel(event.dateMeaning),
    event.url,
  ]);

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCell).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = repositoryName.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  link.href = objectUrl;
  link.download = `rastro-${safeName}-historico.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    origin: true,
  });
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submittedUrl = repositoryUrl.trim();
    if (!submittedUrl) {
      setError("Informe a URL de um repositório.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHistory(null);
      setEventQuery("");
      setActiveFilter("all");
      setSortOrder("oldest");
      setExpandedChapters({ origin: true });
      setMilestonesExpanded(false);

      const data = await getHistory(submittedUrl);
      setHistory(data);
    } catch (err: unknown) {
      console.error("Erro ao buscar histórico:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao reconstruir o histórico."
      );
    } finally {
      setLoading(false);
    }
  }

  const allEvents = history?.events ?? [];
  const milestones = history?.milestones ?? [];
  const normalizedQuery = normalizeText(eventQuery.trim());
  const hasActiveSearch = normalizedQuery.length > 0;
  const hasActiveFilters = hasActiveSearch || activeFilter !== "all";

  const filteredEvents = useMemo(() => {
    if (!history) return [];

    const matching = history.events.filter((event) => {
      const category = getCategory(event.type);
      if (activeFilter !== "all" && category !== activeFilter) return false;
      if (!normalizedQuery) return true;

      const searchableText = normalizeText(
        [event.title, event.description ?? "", event.author ?? "", getCategoryLabel(event.type)].join(" ")
      );
      return searchableText.includes(normalizedQuery);
    });

    return [...matching].sort((a, b) => {
      const aTime = getTimestamp(a.date);
      const bTime = getTimestamp(b.date);
      if (aTime === null && bTime === null) return 0;
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [history, activeFilter, normalizedQuery, sortOrder]);

  const chronologicalEvents = useMemo(() => {
    return [...allEvents]
      .filter((event) => getTimestamp(event.date) !== null)
      .sort((a, b) => (getTimestamp(a.date) ?? 0) - (getTimestamp(b.date) ?? 0));
  }, [allEvents]);

  const contributorStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of allEvents) {
      const author = event.author?.trim();
      if (!author) continue;
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, 5);
  }, [allEvents]);

  const identifiedAuthors = contributorStats.length > 0
    ? new Set(allEvents.map((event) => event.author?.trim()).filter(Boolean)).size
    : 0;

  function toggleChapter(chapterId: string) {
    setExpandedChapters((previous) => ({
      ...previous,
      [chapterId]: !previous[chapterId],
    }));
  }

  function clearFilters() {
    setEventQuery("");
    setActiveFilter("all");
    setSortOrder("oldest");
  }

  return (
    <main className="app">
      <header className="header">
        <a className="logo" href="#top" aria-label="RASTRO, início">
          <span className="logo-mark" aria-hidden="true">
            <span className="logo-line"></span>
            <span className="logo-dot"></span>
            <span className="logo-dot"></span>
            <span className="logo-dot"></span>
          </span>
          <span className="logo-text">RASTRO<span>.</span></span>
        </a>
        <span className="header-label">GITHUB HISTORY EXPLORER</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-content">
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
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="url"
              aria-label="URL do repositório do GitHub"
              placeholder="https://github.com/usuario/repositorio"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Reconstruindo..." : "Explorar →"}
            </button>
          </form>

          {error && <p className="error-message" role="alert">{error}</p>}
          {loading && (
            <div className="loading-state" role="status">
              <span className="loading-indicator"></span>
              <span>Consultando os registros públicos do GitHub...</span>
            </div>
          )}
          <span className="search-hint">EXPLORE REPOSITÓRIOS PÚBLICOS DO GITHUB</span>
        </div>

        {history && (
          <section className="history" aria-label="Histórico do repositório">
            <div className="history-intro">
              <div className="history-intro-main">
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
              <div className="history-created">
                <span>CRIADO EM</span>
                <strong>{formatDate(history.repository.createdAt, false)}</strong>
              </div>
            </div>

            <div className="history-summary" aria-label="Resumo do histórico">
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
              <div className="summary-item">
                <strong>{history.summary.contributors}</strong>
                <span>COLABORADORES</span>
              </div>
              <div className="summary-item">
                <strong>{history.summary.milestones}</strong>
                <span>MARCOS</span>
              </div>
            </div>

            <section className="history-insights" aria-label="Visão geral da trajetória">
              <article className="insight-card">
                <span className="insight-label">PRIMEIRO REGISTRO RECUPERADO</span>
                <strong>{chronologicalEvents.length ? formatDate(chronologicalEvents[0].date, false) : "Sem data disponível"}</strong>
                <span className="insight-detail">Início do período observado</span>
              </article>
              <article className="insight-card">
                <span className="insight-label">ATIVIDADE MAIS RECENTE</span>
                <strong>{chronologicalEvents.length ? formatDate(chronologicalEvents[chronologicalEvents.length - 1].date, false) : "Sem data disponível"}</strong>
                <span className="insight-detail">Último registro com data válida</span>
              </article>
              <article className="insight-card">
                <span className="insight-label">AUTORES IDENTIFICADOS</span>
                <strong>{identifiedAuthors}</strong>
                <span className="insight-detail">Nomes associados aos acontecimentos</span>
              </article>
            </section>

            {milestones.length > 0 && (
              <section className="milestones-section">
                <div className="section-heading milestones-heading">
                  <div>
                    <span className="eyebrow">MARCOS DA TRAJETÓRIA</span>
                    <h2>Momentos importantes.</h2>
                    <p>
                      Acontecimentos identificados a partir dos registros
                      disponíveis no GitHub.
                    </p>
                  </div>
                  <span className="section-total">{milestones.length} MARCOS</span>
                </div>

                <div className="milestones-grid">
                  {(milestonesExpanded ? milestones : milestones.slice(0, INITIAL_MILESTONE_LIMIT)).map((milestone) => (
                    <article className="milestone-card" key={milestone.id}>
                      <div className="milestone-top">
                        <span className="milestone-indicator"></span>
                        <span className="milestone-date">{formatDate(milestone.date)}</span>
                      </div>
                      <h3>{milestone.title}</h3>
                      <p>{milestone.description}</p>
                      <div className="milestone-footer">
                        <span>{milestone.author || "Registro do projeto"}</span>
                        {milestone.url && (
                          <a href={milestone.url} target="_blank" rel="noreferrer">
                            Ver evidência ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {milestones.length > INITIAL_MILESTONE_LIMIT && (
                  <button
                    className="text-toggle milestones-toggle"
                    type="button"
                    onClick={() => setMilestonesExpanded((current) => !current)}
                    aria-expanded={milestonesExpanded}
                  >
                    {milestonesExpanded ? "Mostrar menos ↑" : `Ver todos os ${milestones.length} marcos ↓`}
                  </button>
                )}
              </section>
            )}

            {contributorStats.length > 0 && (
              <section className="contributors-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">PESSOAS NOS REGISTROS</span>
                    <h2>Quem aparece na trajetória.</h2>
                    <p>
                      Autores identificados nos acontecimentos recuperados. A contagem representa registros, não horas ou esforço de trabalho.
                    </p>
                  </div>
                  <span className="section-total">{identifiedAuthors} AUTORES</span>
                </div>

                <div className="contributors-list">
                  {contributorStats.map((contributor, index) => {
                    const maximum = contributorStats[0]?.count ?? 1;
                    const percentage = Math.max(5, (contributor.count / maximum) * 100);
                    return (
                      <article className="contributor-row" key={contributor.name}>
                        <span className="contributor-rank">{String(index + 1).padStart(2, "0")}</span>
                        <div className="contributor-info">
                          <div className="contributor-line">
                            <strong>{contributor.name}</strong>
                            <span>{contributor.count} {contributor.count === 1 ? "registro" : "registros"}</span>
                          </div>
                          <div className="contributor-track">
                            <span style={{ width: `${percentage}%` }}></span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="history-chapters">
              <div className="chapters-heading">
                <span className="eyebrow">A TRAJETÓRIA</span>
                <h2>A história até aqui.</h2>
                <p>Explore os acontecimentos, encontre registros e percorra o desenvolvimento do projeto.</p>
              </div>

              <div className="history-explorer">
                <div className="explorer-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Buscar por título, descrição ou autor..."
                    aria-label="Buscar acontecimentos no histórico"
                    value={eventQuery}
                    onChange={(event) => setEventQuery(event.target.value)}
                  />
                  {eventQuery && (
                    <button type="button" onClick={() => setEventQuery("")} aria-label="Limpar busca">×</button>
                  )}
                </div>

                <div className="explorer-toolbar">
                  <div className="filter-list" aria-label="Filtrar acontecimentos por tipo">
                    {filters.map((filter) => (
                      <button
                        className={`filter-button ${activeFilter === filter.value ? "active" : ""}`}
                        type="button"
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        aria-pressed={activeFilter === filter.value}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="explorer-actions">
                    <button
                      className="sort-button"
                      type="button"
                      onClick={() => setSortOrder((current) => current === "oldest" ? "newest" : "oldest")}
                      aria-label="Alterar ordem cronológica"
                    >
                      <span aria-hidden="true">↕</span>
                      {sortOrder === "oldest" ? "Mais antigos" : "Mais recentes"}
                    </button>
                    <button
                      className="export-button"
                      type="button"
                      disabled={filteredEvents.length === 0}
                      onClick={() => exportEventsToCsv(filteredEvents, history.repository.name)}
                    >
                      Exportar CSV ↓
                    </button>
                  </div>
                </div>

                <div className="results-line" aria-live="polite">
                  <span>{filteredEvents.length} {filteredEvents.length === 1 ? "acontecimento encontrado" : "acontecimentos encontrados"}</span>
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters}>Limpar filtros ×</button>
                  )}
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="empty-results">
                  <span className="empty-symbol">⌕</span>
                  <h3>Nenhum registro encontrado.</h3>
                  <p>Tente outro termo ou remova os filtros aplicados.</p>
                  <button type="button" className="text-toggle" onClick={clearFilters}>Limpar filtros</button>
                </div>
              ) : (
                chapters.map((chapter) => {
                  const chapterEvents = filteredEvents.filter(
                    (event) => getCategory(event.type) === chapter.id
                  );
                  if (chapterEvents.length === 0) return null;

                  const isExpanded = expandedChapters[chapter.id] ?? false;
                  const hasMore = chapterEvents.length > chapter.initialLimit;
                  const showAll = isExpanded || hasActiveFilters || !hasMore;
                  const visibleEvents = showAll
                    ? chapterEvents
                    : chapterEvents.slice(0, chapter.initialLimit);

                  return (
                    <section className="history-chapter" key={chapter.id} id={`chapter-${chapter.id}`}>
                      <div className="chapter-heading">
                        <span className="chapter-number">{chapter.number}</span>
                        <div className="chapter-title">
                          <h3>{chapter.title}</h3>
                          <p>{chapter.description}</p>
                        </div>
                        <div className="chapter-actions">
                          <span className="chapter-count">{chapterEvents.length}</span>
                          {hasMore && !hasActiveFilters && (
                            <button
                              className="chapter-toggle"
                              type="button"
                              onClick={() => toggleChapter(chapter.id)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? "Recolher ↑" : `Ver todos +${chapterEvents.length - visibleEvents.length}`}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="history-events">
                        {visibleEvents.map((event) => (
                          <article className="history-event" key={event.id}>
                            <div className="event-marker" aria-hidden="true"></div>
                            <div className="event-content">
                              <div className="event-meta">
                                <span className="event-date">{formatDate(event.date)}</span>
                                <span className="event-type">{getCategoryLabel(event.type)}</span>
                              </div>
                              <h4>{event.title}</h4>
                              {event.description && <p className="event-description">{event.description}</p>}
                              <p className="event-context">{getEventContext(event)}</p>
                              <span className="event-date-meaning">{getDateMeaningLabel(event.dateMeaning)}</span>
                              <div className="event-footer">
                                <span>{event.author || "Autor não identificado"}</span>
                                {event.url && (
                                  <a href={event.url} target="_blank" rel="noreferrer">
                                    Consultar registro ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      {hasMore && isExpanded && !hasActiveFilters && (
                        <button
                          className="chapter-bottom-toggle"
                          type="button"
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          Recolher capítulo ↑
                        </button>
                      )}
                    </section>
                  );
                })
              )}
            </section>

            <div className="history-coverage">
              <span className="eyebrow">TRANSPARÊNCIA HISTÓRICA</span>
              <h3>Sobre esta reconstrução</h3>
              <p>{history.coverage.note}</p>
              <span>Limite de consulta: {history.coverage.limitPerCategory} registros por categoria.</span>
            </div>
          </section>
        )}
      </section>

      <footer className="footer">
        <span>RASTRO © 2026</span>
        <span>EVERY CODE HAS A STORY.</span>
      </footer>
    </main>
  );
}

export default App;