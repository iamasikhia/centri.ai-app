
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;

    constructor(private config: ConfigService) {
        const apiKey = this.config.get('RESEND_API_KEY') || 're_123'; // Fallback for dev/fail
        this.resend = new Resend(apiKey);
    }

    async sendUpdateEmail(to: string, updates: any[]) {
        if (!to || updates.length === 0) return;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Updates from Centri</h2>
                <p>You have ${updates.length} new high-priority updates.</p>
                <hr />
                ${updates.map(u => `
                    <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold; color: ${u.severity === 'urgent' ? 'red' : 'orange'}">
                            [${u.severity.toUpperCase()}] ${u.source}
                        </div>
                        <h3 style="margin: 5px 0;">${u.title}</h3>
                        <p style="margin: 0; color: #555;">${u.body || ''}</p>
                        ${u.url ? `<a href="${u.url}" style="display: block; margin-top: 5px; color: blue;">Open Link</a>` : ''}
                    </div>
                `).join('')}
                <br />
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
            </div>
        `;

        try {
            // Note: In development without a verified domain, Resend only sends to the account email.
            // We'll try sending to the user's email.
            await this.resend.emails.send({
                from: 'Centri Updates <onboarding@resend.dev>', // Default testing domain
                to: [to],
                subject: `Centri: ${updates.length} New Update${updates.length > 1 ? 's' : ''}`,
                html
            });
            console.log(`Email sent to ${to}`);
        } catch (e) {
            console.error('Failed to send email', e);
        }
    }
}
