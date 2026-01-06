import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface FileNode {
    path: string;
    type: 'file' | 'directory';
    size?: number;
    language?: string;
}

export interface DependencyInfo {
    name: string;
    version: string;
    type: 'production' | 'development';
}

export interface CodebaseStructure {
    repository: string;
    defaultBranch: string;
    languages: { [key: string]: number };
    fileTree: FileNode[];
    dependencies: DependencyInfo[];
    readme: string;
    documentation: { [path: string]: string };
    apiEndpoints?: string[];
    recentCommits: Array<{
        sha: string;
        message: string;
        author: string;
        date: string;
    }>;
}

@Injectable()
export class CodebaseAnalyzerService {
    async analyzeRepository(
        accessToken: string,
        owner: string,
        repo: string
    ): Promise<CodebaseStructure> {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
        };

        try {
            // 1. Get repository info
            const repoRes = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}`,
                { headers }
            );
            const defaultBranch = repoRes.data.default_branch;

            // 2. Get languages
            const langRes = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/languages`,
                { headers }
            );
            const languages = langRes.data;

            // 3. Get file tree
            const treeRes = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
                { headers }
            );
            const fileTree: FileNode[] = treeRes.data.tree.map((item: any) => ({
                path: item.path,
                type: item.type === 'tree' ? 'directory' : 'file',
                size: item.size,
            }));

            // 4. Get README
            let readme = '';
            try {
                const readmeRes = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/readme`,
                    { headers }
                );
                readme = Buffer.from(readmeRes.data.content, 'base64').toString('utf-8');
            } catch (e) {
                console.log('[CodebaseAnalyzer] No README found');
            }

            // 5. Get dependencies (package.json, requirements.txt, etc.)
            const dependencies = await this.extractDependencies(accessToken, owner, repo, fileTree);

            // 6. Get recent commits
            const commitsRes = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/commits`,
                { headers, params: { per_page: 10 } }
            );
            const recentCommits = commitsRes.data.map((commit: any) => ({
                sha: commit.sha.substring(0, 7),
                message: commit.commit.message.split('\n')[0],
                author: commit.commit.author.name,
                date: commit.commit.author.date,
            }));

            // 7. Collect documentation files
            const documentation: { [path: string]: string } = {};
            const docPaths = fileTree
                .filter(f =>
                    f.type === 'file' &&
                    (f.path.includes('docs/') || f.path.endsWith('.md')) &&
                    f.path !== 'README.md'
                )
                .slice(0, 10); // Limit to 10 doc files

            for (const docFile of docPaths) {
                try {
                    const fileRes = await axios.get(
                        `https://api.github.com/repos/${owner}/${repo}/contents/${docFile.path}`,
                        { headers }
                    );
                    const content = Buffer.from(fileRes.data.content, 'base64').toString('utf-8');
                    documentation[docFile.path] = content;
                } catch (e) {
                    // Skip if file can't be read
                }
            }

            return {
                repository: `${owner}/${repo}`,
                defaultBranch,
                languages,
                fileTree,
                dependencies,
                readme,
                documentation,
                recentCommits,
            };
        } catch (error) {
            console.error('[CodebaseAnalyzer] Analysis failed', error.message);
            throw new Error('Failed to analyze repository');
        }
    }

    private async extractDependencies(
        accessToken: string,
        owner: string,
        repo: string,
        fileTree: FileNode[]
    ): Promise<DependencyInfo[]> {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
        };

        const dependencies: DependencyInfo[] = [];

        // Check for package.json (Node.js)
        if (fileTree.some(f => f.path === 'package.json')) {
            try {
                const pkgRes = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
                    { headers }
                );
                const pkgJson = JSON.parse(
                    Buffer.from(pkgRes.data.content, 'base64').toString('utf-8')
                );

                if (pkgJson.dependencies) {
                    Object.entries(pkgJson.dependencies).forEach(([name, version]) => {
                        dependencies.push({ name, version: version as string, type: 'production' });
                    });
                }
                if (pkgJson.devDependencies) {
                    Object.entries(pkgJson.devDependencies).forEach(([name, version]) => {
                        dependencies.push({ name, version: version as string, type: 'development' });
                    });
                }
            } catch (e) {
                console.log('[CodebaseAnalyzer] Could not parse package.json');
            }
        }

        // Check for requirements.txt (Python)
        if (fileTree.some(f => f.path === 'requirements.txt')) {
            try {
                const reqRes = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/contents/requirements.txt`,
                    { headers }
                );
                const reqTxt = Buffer.from(reqRes.data.content, 'base64').toString('utf-8');
                const lines = reqTxt.split('\n').filter(l => l.trim() && !l.startsWith('#'));

                lines.forEach(line => {
                    const match = line.match(/^([^=<>]+)([=<>]+)(.+)$/);
                    if (match) {
                        dependencies.push({
                            name: match[1].trim(),
                            version: match[3].trim(),
                            type: 'production',
                        });
                    }
                });
            } catch (e) {
                console.log('[CodebaseAnalyzer] Could not parse requirements.txt');
            }
        }

        return dependencies;
    }
}
