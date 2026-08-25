export interface GitHubRepo {
  name: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
}

interface GitHubApiRepo {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
}

export async function fetchGitHubRepos(
  username: string,
  token?: string,
  limit = 6
): Promise<GitHubRepo[]> {
  if (!username) return [];
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "portfolio-build",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers,
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!response.ok) return [];

    const data = (await response.json()) as GitHubApiRepo[];
    if (!Array.isArray(data)) return [];

    return data
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, limit)
      .map((repo) => ({
        name: repo.name,
        htmlUrl: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
      }));
  } catch {
    return [];
  }
}