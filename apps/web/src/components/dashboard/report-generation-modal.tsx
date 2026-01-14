'use client';

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { FileText, Loader2, Sparkles, Lightbulb } from "lucide-react";

interface ReportGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    repository?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function ReportGenerationModal({ isOpen, onClose, repository }: ReportGenerationModalProps) {
    const [reportContent, setReportContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [dataSource, setDataSource] = useState<'codebase' | 'meetings' | 'both'>('both');
    const [reportType, setReportType] = useState<'product' | 'tasks'>('product');

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/codebase/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user-id' },
                body: JSON.stringify({
                    repository: repository || 'default/dashboard-report',
                    includeProductData: dataSource === 'meetings' || dataSource === 'both',
                    includeCodebaseData: dataSource === 'codebase' || dataSource === 'both',
                    reportType,
                    action: 'preview'
                })
            });

            const data = await res.json();
            if (data.error) {
                alert(`Error: ${data.error}`);
                return;
            }

            setReportContent(data.content || '');
        } catch (e: any) {
            alert('Failed to generate report: ' + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportToGoogleDocs = async () => {
        if (!reportContent) return;

        setIsExporting(true);
        try {
            const res = await fetch(`${API_URL}/codebase/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user-id' },
                body: JSON.stringify({
                    repository: repository || 'default/dashboard-report',
                    action: 'export',
                    content: reportContent
                })
            });

            const data = await res.json();
            if (data.error) {
                alert(`Error: ${data.error}\n${data.details || ''}`);
                return;
            }

            if (data.url) {
                window.open(data.url, '_blank');
                onClose();
                setReportContent('');
            }
        } catch (e: any) {
            alert('Failed to export: ' + e.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setReportContent('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Generate Product Report</h2>
                            <p className="text-sm text-muted-foreground">
                                Comprehensive analysis with codebase insights and product data
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                    {!reportContent ? (
                        /* Empty State */
                        <div className="h-[500px] flex flex-col items-center justify-center p-8 overflow-y-auto">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-12 h-12 text-white" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold mb-3 text-center">
                                Ready to Create Your Report
                            </h3>

                            <p className="text-muted-foreground text-center max-w-md mb-2 leading-relaxed">
                                Generate a professional engineering progress report for management.
                            </p>

                            {repository ? (
                                <p className="text-sm text-center text-blue-600 dark:text-blue-400 font-medium mb-6">
                                    Repository: {repository}
                                </p>
                            ) : (
                                <p className="text-sm text-center text-amber-600 dark:text-amber-400 mb-6">
                                    ⚠️ No repository selected - report will include meetings only
                                </p>
                            )}

                            {/* Report Type Selector */}
                            <div className="w-full max-w-sm mb-4">
                                <label className="text-sm font-medium mb-2 block text-center">
                                    Report Type
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                                    <button
                                        onClick={() => setReportType('product')}
                                        className={`py-2 text-sm font-medium rounded-md transition-all ${reportType === 'product' ? 'bg-white text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Product Report
                                    </button>
                                    <button
                                        onClick={() => setReportType('tasks')}
                                        className={`py-2 text-sm font-medium rounded-md transition-all ${reportType === 'tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Weekly Task Report
                                    </button>
                                </div>
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    {reportType === 'product'
                                        ? 'Strategic focus: Architecture, GitHub activity & high-level decisions'
                                        : 'Execution focus: Weekly tasks, active tickets & completed work log'}
                                </p>
                            </div>

                            {/* Data Source Selector */}
                            <div className="w-full max-w-sm mb-6">
                                <label className="text-sm font-medium mb-2 block text-center">
                                    Data Sources
                                </label>
                                <Select value={dataSource} onValueChange={(value: any) => setDataSource(value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="both">
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">Full Engineering Report</span>
                                                <span className="text-xs text-muted-foreground">Codebase + GitHub activity + Meetings</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="codebase">
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">Technical Analysis Only</span>
                                                <span className="text-xs text-muted-foreground">Architecture & codebase insights</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="meetings">
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">Progress & Decisions</span>
                                                <span className="text-xs text-muted-foreground">GitHub commits/PRs & meeting outcomes</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleGenerateReport}
                                disabled={isGenerating}
                                size="lg"
                                className="w-full max-w-sm gap-2 px-8 py-[15px] mt-4 text-base font-medium rounded-lg bg-neutral-700 hover:bg-neutral-800 text-white shadow-sm hover:shadow transition-all"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Report...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Report
                                    </>
                                )}
                            </Button>


                            {isGenerating && (
                                <p className="text-xs text-muted-foreground mt-4 animate-pulse">
                                    This may take a few moments...
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Report Editor */
                        <div className="h-[500px] flex flex-col p-6 gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">Report Content</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Edit the markdown content below before exporting
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="px-2 py-1 bg-muted rounded">
                                        {reportContent.length.toLocaleString()} characters
                                    </span>
                                </div>
                            </div>

                            <Textarea
                                value={reportContent}
                                onChange={(e) => setReportContent(e.target.value)}
                                className="flex-1 font-mono text-sm resize-none border-2 focus:border-blue-500 transition-colors"
                                placeholder="Your report content will appear here..."
                            />

                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                <Lightbulb className="w-4 h-4 text-blue-600" />
                                <span>
                                    Tip: The report uses Markdown formatting. Headings, lists, and bold text will be preserved in Google Docs.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleExportToGoogleDocs}
                        disabled={!reportContent || isExporting}
                        className="gap-2 px-6"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                Export to Google Docs
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
