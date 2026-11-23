import api from "./api";

export interface HistoryEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string | null;
  dateMeaning: string;
  author: string | null;
  url: string | null;
}

export interface HistoryMilestone {
  id: string;
  type?: string;
  title: string;
  description: string;
  date: string | null;
  author: string | null;
  url: string | null;
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
    contributors: number;
    milestones: number;
  };
  milestones: HistoryMilestone[];
  events: HistoryEvent[];
  coverage: {
    limitPerCategory: number;
    note: string;
  };
}

export async function getHistory(repositoryUrl: string): Promise<HistoryResponse> {
  const response = await api.get<HistoryResponse>("/history", {
    params: { url: repositoryUrl },
  });

  return response.data;
}