import { Injectable, Logger } from '@nestjs/common';
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger('GitHubService');
  public async getRepos(): Promise<GitHubRepo[]> {
    try {
      const params = new URLSearchParams({
        per_page: '100',
        sort: 'updated',
      });
      const url = `https://api.github.com/user/repos?${params}`;
      this.logger.log(`Fetching repos from: ${url}`);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'NestJS-App/1.0', // 👈 关键修复
        },
      });

      const repos = (await res.json()) as GitHubRepo[];
      return repos;
    } catch (error) {
      this.logger.error(JSON.stringify(error));
    }
    return [];
  }
}
