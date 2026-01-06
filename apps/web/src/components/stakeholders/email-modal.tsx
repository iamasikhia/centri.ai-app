
import { useState, useEffect } from 'react';
import { SimpleModal } from './simple-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Stakeholder } from '@/types/stakeholder';
import { Loader2, Send } from 'lucide-react';

interface EmailModalProps {
    stakeholder: Stakeholder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSend: (stakeholderId: string, subject: string, body: string) => Promise<void>;
}

export function EmailModal({ stakeholder, open, onOpenChange, onSend }: EmailModalProps) {
    const [subject, setSubject] = useState('Quick check-in');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (open && stakeholder) {
            setBody(`Hi ${stakeholder.name.split(' ')[0]},\n\nJust wanted to check in...`);
            setSubject('Quick check-in');
        }
    }, [open, stakeholder]);

    const handleSend = async () => {
        if (!stakeholder) return;
        setSending(true);
        // Mock network delay
        await new Promise(r => setTimeout(r, 1000));
        await onSend(stakeholder.id, subject, body);
        setSending(false);
        onOpenChange(false);
    };

    if (!stakeholder) return null;

    return (
        <SimpleModal
            open={open}
            onClose={() => onOpenChange(false)}
            title="Contact Stakeholder"
            description={`Draft an email to ${stakeholder.name} (${stakeholder.email}).`}
        >
            <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                    <Label htmlFor="to">To</Label>
                    <Input id="to" value={stakeholder.email} disabled className="bg-muted text-muted-foreground" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message..."
                        rows={8}
                        className="resize-none"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
                    <Button onClick={handleSend} disabled={!body.trim() || sending}>
                        {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Email
                    </Button>
                </div>
            </div>
        </SimpleModal>
    );
}
