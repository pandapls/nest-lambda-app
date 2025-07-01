import { Controller, Get } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}
  @Get()
  async getRepoList() {
    const repos = await this.githubService.getRepos();
    return repos.map((item) => ({
      id: item.id,
      name: item.name,
      fullName: item.name,
      description: item.description,
      htmlUrl: item.html_url,
      updatedAt: item.updated_at,
    }));
  }
}
