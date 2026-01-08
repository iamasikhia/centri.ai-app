
import { DailyTriageBrief, GitHubItem, ProjectContext, TriagedItem, TriageFeedback } from './domain/contracts';

/**
 * AGENT ARCHITECTURE INTERFACES
 * 
 * Defines the boundaries and responsibilities of each intelligent agent.
 * Implementation should use Dependency Injection.
 */

// 1. Scheduler Agent
// Triggers the workflow. Can correspond to cron jobs or API webhooks.
export interface ISchedulerAgent {
    scheduleDailyTriage(cronExpression: string): void;
    triggerAdHocTriage(userId: string): Promise<void>;
}

// 2. GitHub Research Agent
// "Eyes and Ears" - Fetches and normalizes raw data. NO analysis.
export interface IGithubResearchAgent {
    /**
     * Fetches items modified since the given date.
     * Handles pagination, rate limiting, and normalization.
     */
    fetchRecentActivity(since: Date, repoIds: string[]): Promise<GitHubItem[]>;

    /**
     * Deep fetch for specific item context (comments, diff summaries).
     */
    enrichItemContext(itemId: string): Promise<string>;
}

// 3. Knowledge Agent
// "Context Provider" - Knows about the team, goals, and history.
export interface IKnowledgeAgent {
    getProjectContext(workspaceId: string): Promise<ProjectContext>;

    /**
     * Retrieves historical triage decisions to inform current run (Few-Shot Learning)
     */
    getReviewHistory(limit: number): Promise<any[]>;
}

// 4. Orchestration & Reasoning Agent (CORE)
// "The Brain" - Synthesizes Research + Knowledge to make decisions.
export interface IOrchestrationAgent {
    analyzeAndTriage(
        rawItems: GitHubItem[],
        context: ProjectContext
    ): Promise<TriagedItem[]>;

    /**
     * Re-evaluates priority based on new information.
     */
    recalibratePriority(item: TriagedItem, feedback: TriageFeedback): Promise<TriagedItem>;
}

// 5. Summary Agent
// "The Writer" - Translates technical triage into PM-friendly prose.
export interface ISummaryAgent {
    generateDailyBrief(
        triagedItems: TriagedItem[],
        context: ProjectContext
    ): Promise<DailyTriageBrief>;
}

// 6. Slack Integration Agent
// "The Messenger" - Delivers the brief and handles interactivity.
export interface ISlackAgent {
    postDailyBrief(brief: DailyTriageBrief, channelId: string): Promise<string>; // Returns threadId
    postAlert(item: TriagedItem, channelId: string): Promise<void>;

    /**
     * Updates a previous message based on feedback (e.g. "Marked as done")
     */
    updateMessageState(messageId: string, state: any): Promise<void>;
}

// 7. Feedback Loop Agent
// "The Learner" - Records actions to improve future runs.
export interface IFeedbackLoopAgent {
    recordFeedback(feedback: TriageFeedback): Promise<void>;

    /**
     * Analyzes feedback trends to suggest rule changes.
     * e.g. "User X always ignores 'Documentation' items."
     */
    generateOptimizationSuggestions(): Promise<string[]>;
}
