import api from "./api";

export interface HistoryEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  dateMeaning: string;
  author: string | null;
  url: string;
}

export interface HistoryResponse {
  repository: {
    name: string;
    description: string | null;
    createdAt: string;
    url: string;
  };
  summary: {
    commits: number;
    releases: number;
    pullRequests: number;
    events: number;
  };
  events: HistoryEvent[];
  coverage: {
    limitPerCategory: number;
    note: string;
  };
}

export async function getHistory(repositoryUrl: string) {
  const response = await api.get("/history", {
    params: { url: repositoryUrl },
  });

  return response.data as HistoryResponse;
}