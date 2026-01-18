'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2, Mail, CheckCircle2 } from 'lucide-react';

interface EnterpriseContactModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EnterpriseContactModal({ open, onOpenChange }: EnterpriseContactModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        companySize: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Send to backend feedback endpoint
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            
            const message = `Enterprise Plan Inquiry

Company: ${formData.company}
Company Size: ${formData.companySize || 'Not specified'}
Phone: ${formData.phone || 'Not provided'}

Message:
${formData.message}`;

            await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': formData.email,
                    'x-user-name': formData.name,
                },
                body: JSON.stringify({
                    type: 'enterprise_contact',
                    message: message,
                    page: 'pricing',
                }),
            });

            // Show success state
            setIsSubmitted(true);
            
            // Reset form after 3 seconds and close modal
            setTimeout(() => {
                setFormData({
                    name: '',
                    email: '',
                    company: '',
                    phone: '',
                    companySize: '',
                    message: '',
                });
                setIsSubmitted(false);
                onOpenChange(false);
            }, 3000);

        } catch (error) {
            console.error('Failed to submit enterprise contact form:', error);
            // Still show success to user (graceful degradation)
            setIsSubmitted(true);
            setTimeout(() => {
                setIsSubmitted(false);
                onOpenChange(false);
            }, 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({
                name: '',
                email: '',
                company: '',
                phone: '',
                companySize: '',
                message: '',
            });
            setIsSubmitted(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Building2 className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl">Enterprise Plan Inquiry</DialogTitle>
                            <DialogDescription className="mt-1">
                                Get in touch with our sales team for custom pricing and enterprise features
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {isSubmitted ? (
                    <div className="py-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Thank you for your interest!</h3>
                        <p className="text-muted-foreground mb-4">
                            Our sales team will reach out to you within 24 hours.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Or email us directly at{' '}
                            <a href="mailto:sales@centri.ai" className="text-primary hover:underline">
                                sales@centri.ai
                            </a>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">
                                    Company Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="company"
                                    placeholder="Acme Inc."
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companySize">Company Size</Label>
                                <Input
                                    id="companySize"
                                    placeholder="e.g., 50-100 employees"
                                    value={formData.companySize}
                                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">
                                Message <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="message"
                                placeholder="Tell us about your needs, specific requirements, or questions about the Enterprise plan..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={5}
                                required
                                disabled={isSubmitting}
                                className="resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                By submitting, you agree to be contacted by our sales team.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="min-w-[120px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

