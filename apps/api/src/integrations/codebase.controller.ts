import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { GithubDocsService } from './github-docs.service';
import { CodebaseExplainerService } from './codebase-explainer.service';
import { CodebaseAnalyzerService } from './codebase-analyzer.service';
import { IntegrationsService } from './integrations.service';

@Controller('codebase')
export class CodebaseController {
    constructor(
        private readonly githubDocsService: GithubDocsService,
        private readonly explainerService: CodebaseExplainerService,
        private readonly analyzerService: CodebaseAnalyzerService,
        private readonly integrationsService: IntegrationsService,
    ) { }

    @Get('repositories')
    async listRepositories(@Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';

        try {
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!token || !token.access_token) {
                return { repositories: [], error: 'GitHub not connected' };
            }

            const repositories = await this.githubDocsService.listUserRepositories(token.access_token);
            return { repositories };
        } catch (error) {
            console.error('[Codebase] Failed to list repositories', error.message);
            return { repositories: [], error: 'Failed to fetch repositories' };
        }
    }

    @Get('analyze')
    async analyzeRepository(@Query('repository') repository: string, @Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';

        if (!repository) {
            return { error: 'Repository is required' };
        }

        try {
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!token || !token.access_token) {
                return { error: 'GitHub not connected' };
            }

            const [owner, repo] = repository.split('/');
            if (!owner || !repo) {
                return { error: 'Invalid repository format. Expected: owner/repo' };
            }

            // Analyze repository structure
            const analysis = await this.analyzerService.analyzeRepository(
                token.access_token,
                owner,
                repo
            );

            return { analysis };
        } catch (error) {
            console.error('[Codebase] Analysis failed', error.message);
            return { error: 'Failed to analyze repository', details: error.message };
        }
    }

    @Post('explain')
    async explainCodebase(@Body() body: { repository: string }, @Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        const { repository } = body;

        if (!repository) {
            return { error: 'Repository is required' };
        }

        try {
            // Get GitHub token
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!token || !token.access_token) {
                return { error: 'GitHub not connected' };
            }

            // Parse owner/repo
            const [owner, repo] = repository.split('/');
            if (!owner || !repo) {
                return { error: 'Invalid repository format. Expected: owner/repo' };
            }

            // Fetch documentation
            const documentation = await this.githubDocsService.fetchRepositoryDocumentation(
                token.access_token,
                owner,
                repo
            );

            if (!documentation.combinedContent || documentation.combinedContent.trim().length === 0) {
                return {
                    error: 'No documentation found',
                    message: 'This repository does not have a README or documentation files.',
                };
            }

            // Generate AI explanation
            const explanation = await this.explainerService.explainCodebase(
                documentation.combinedContent,
                repository
            );

            return {
                repository,
                explanation,
                filesAnalyzed: documentation.files.filter(f => f.found).map(f => f.path),
            };
        } catch (error) {
            console.error('[Codebase] Explanation failed', error.message);
            return { error: 'Failed to generate explanation', details: error.message };
        }
    }
}
