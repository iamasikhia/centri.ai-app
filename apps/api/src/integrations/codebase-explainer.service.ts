import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface CodebaseExplanation {
    productOverview: string;
    targetAudience: string;
    keyComponents: string;
    technicalArchitecture: string;
    howItWorks: string;
    currentDevelopment: string;
    risksAndUnknowns: string;
    executiveSummary: string;
}

@Injectable()
export class CodebaseExplainerService {
    private openai: OpenAI | null;

    constructor(private config: ConfigService) {
        const apiKey = this.config.get<string>('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            console.warn('[CodebaseExplainer] OPENAI_API_KEY missing. Codebase explanation features will be disabled.');
            this.openai = null;
        }
    }

    async explainCodebase(documentation: string, repositoryName: string): Promise<CodebaseExplanation> {
        const prompt = `You are a Chief Technology Officer (CTO) explaining the comprehensive architecture and product vision of a codebase to a Product Manager. The PM needs a robust understanding of the system's internal logic, data flow, and structural design, but explained in clear, logical terms without getting lost in syntax.

Repository: ${repositoryName}

Documentation:
${documentation}

Based on the documentation above, provide a robust, detailed explanation using clear Markdown formatting. Use bullet points for lists and bold text for key concepts. Structure your response EXACTLY as follows:

## Product Overview
[What this product does, its core value proposition, and the primary problem it solves. 3-4 sentences.]

## Target Audience
[Who are the primary users? (e.g., developers, enterprise customers, consumers). Who benefits most?]

## Key Components
[Identify the major functional blocks (e.g., "Authentication Service", "Payment Processor", "Frontend Dashboard"). Describe what each does in business terms. Use a bulleted list.]

## Technical Architecture
[Explain the system architecture in detail.
1. Provide a text explanation of the stack and strategy.
2. INCLUDE A MERMAID FLOWCHART describing the high-level architecture. Wrap the mermaid code in a code block like:
\`\`\`mermaid
graph TD;
    Client-->API;
    API-->DB;
\`\`\`
Ensure the diagram shows the flow between Frontend, Backend, Database, and potential External Services.]

## How It Works
[Walk through a core user flow to demonstrate how the components interact. Use a numbered list for the steps.]

## Current Development Focus
[Based on recent commits or features mentioned, what is the engineering team currently prioritizing? Use a bulleted list.]

## Risks & Unknowns
[Potential scalability bottlenecks, security considerations, or areas that seem complex or undocumented.]

## Executive Summary
[A high-level synthesis of the project's state, suitable for a stakeholder presentation. Focus on readiness and capability.]

CRITICAL RULES:
- Use clear, professional, yet accessible language.
- **Use Markdown lists ( - item) and bold text (**text**) generously** to make it readable.
- Explain "Architecture" by describing the *relationship* between parts, not just listing tools.
- **The Mermaid diagram MUST be simple and valid syntax.**
- Be comprehensive but concise.
`;

        if (!this.openai) {
            console.warn('[CodebaseExplainer] OpenAI client not initialized. Using fallback.');
            return this.generateFallbackExplanation(documentation, repositoryName);
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert CTO and Product Leader capable of translating complex code architectures into clear, strategic business insights.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 3000,
            });

            const content = response.choices[0].message.content;
            return this.parseExplanation(content);
        } catch (error) {
            console.error('[CodebaseExplainer] AI generation failed', error.message);

            // Fallback to basic extraction if AI fails
            return this.generateFallbackExplanation(documentation, repositoryName);
        }
    }

    private generateFallbackExplanation(documentation: string, repositoryName: string): CodebaseExplanation {
        // Extract first paragraph or description
        const lines = documentation.split('\n').filter(l => l.trim().length > 0);
        const firstParagraph = lines.slice(0, 5).join(' ').substring(0, 500);

        return {
            productOverview: `${repositoryName} - ${firstParagraph || 'A software project with documentation available for review.'}`,
            targetAudience: 'Information extracted from available documentation. Full AI analysis requires OpenAI API access.',
            keyComponents: 'Please review the documentation files directly for component details.',
            technicalArchitecture: 'Architecture analysis requires specific documentation review or AI explanation.',
            howItWorks: 'Detailed workflow information is available in the repository documentation.',
            currentDevelopment: 'Check recent commits and pull requests for active development areas.',
            risksAndUnknowns: 'AI-powered analysis is currently unavailable. Manual review of documentation recommended.',
            executiveSummary: `${repositoryName} is a software project. For a detailed business analysis, please ensure OpenAI API access is configured.`,
        };
    }

    private parseExplanation(content: string): CodebaseExplanation {
        const sections = {
            productOverview: this.extractSection(content, 'Product Overview'),
            targetAudience: this.extractSection(content, 'Target Audience'),
            keyComponents: this.extractSection(content, 'Key Components'),
            technicalArchitecture: this.extractSection(content, 'Technical Architecture'),
            howItWorks: this.extractSection(content, 'How It Works'),
            currentDevelopment: this.extractSection(content, 'Current Development Focus'),
            risksAndUnknowns: this.extractSection(content, 'Risks & Unknowns'),
            executiveSummary: this.extractSection(content, 'Executive Summary'),
        };

        return sections;
    }

    private extractSection(content: string, sectionName: string): string {
        const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim() : 'Information not available';
    }
}
