
import api from "./api";

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string | null;
    login: string | null;
    avatar: string | null;
  };
  date: string | null;
  url: string;
}

export async function getCommits(repositoryUrl: string) {
  const response = await api.get("/commits", {
    params: { url: repositoryUrl },
  });

  return response.data as Commit[];
}
