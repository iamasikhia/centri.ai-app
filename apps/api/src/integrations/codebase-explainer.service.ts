import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface CodebaseExplanation {
    productOverview: string;
    targetAudience: string;
    keyComponents: string;
    howItWorks: string;
    currentDevelopment: string;
    risksAndUnknowns: string;
    executiveSummary: string;
}

@Injectable()
export class CodebaseExplainerService {
    private openai: OpenAI;

    constructor(private config: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.config.get('OPENAI_API_KEY'),
        });
    }

    async explainCodebase(documentation: string, repositoryName: string): Promise<CodebaseExplanation> {
        const prompt = `You are a senior product manager explaining a software product to a NON-TECHNICAL product manager who needs to understand what engineering is building.

Repository: ${repositoryName}

Documentation:
${documentation}

Based on the documentation above, provide a clear, business-friendly explanation of this product. Structure your response EXACTLY as follows:

## Product Overview
[What this product does in 2-3 sentences that a CEO would understand]

## Target Audience
[Who this product is for - customers, internal teams, etc.]

## Key Components
[High-level parts of the system described in simple business terms, NOT technical architecture]

## How It Works
[Conceptual flow of how the system operates from a user perspective]

## Current Development Focus
[What appears to be actively being worked on or prioritized]

## Risks & Unknowns
[Any unclear areas, potential concerns, or gaps in understanding]

## Executive Summary
[2-3 sentence summary suitable for a board deck or leadership update]

CRITICAL RULES:
- Use plain business language
- Avoid technical jargon (no "API", "database", "framework" unless absolutely necessary)
- Write as if explaining to a non-technical stakeholder
- Focus on WHAT and WHY, not HOW
- Be concise but informative`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert product manager who translates technical documentation into executive-friendly business language.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
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
