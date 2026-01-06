import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface DocumentationFile {
    path: string;
    content: string;
    found: boolean;
}

export interface RepositoryDocumentation {
    repository: string;
    files: DocumentationFile[];
    combinedContent: string;
}

@Injectable()
export class GithubDocsService {
    private readonly DOCUMENTATION_PATHS = [
        'README.md',
        'docs/README.md',
        'docs/index.md',
        'CONTRIBUTING.md',
        'docs/overview.md',
        'ARCHITECTURE.md',
    ];

    async fetchRepositoryDocumentation(
        accessToken: string,
        owner: string,
        repo: string
    ): Promise<RepositoryDocumentation> {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
        };

        const files: DocumentationFile[] = [];
        const foundContents: string[] = [];

        // Attempt to fetch each documentation file
        for (const path of this.DOCUMENTATION_PATHS) {
            try {
                const response = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
                    { headers }
                );

                if (response.data.content) {
                    // GitHub returns base64 encoded content
                    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
                    files.push({ path, content, found: true });
                    foundContents.push(`\n\n=== ${path} ===\n\n${content}`);
                }
            } catch (error) {
                // File doesn't exist, skip gracefully
                files.push({ path, content: '', found: false });
            }
        }

        return {
            repository: `${owner}/${repo}`,
            files,
            combinedContent: foundContents.join('\n\n'),
        };
    }

    async listUserRepositories(accessToken: string): Promise<Array<{ name: string; fullName: string }>> {
        try {
            const headers = {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            };

            const response = await axios.get('https://api.github.com/user/repos', {
                headers,
                params: {
                    sort: 'pushed',
                    direction: 'desc',
                    per_page: 50,
                },
            });

            return response.data.map((repo: any) => ({
                name: repo.name,
                fullName: repo.full_name,
            }));
        } catch (error) {
            console.error('[GithubDocs] Failed to list repositories', error.message);
            return [];
        }
    }
}
