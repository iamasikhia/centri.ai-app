
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userId = 'default-user-id';

        // Create 'Today' newsletter
        await prisma.updateItem.create({
            data: {
                userId,
                source: 'gmail',
                type: 'newsletter',
                severity: 'info',
                title: 'Test Newsletter: Today',
                body: 'This is a test newsletter created for today.',
                occurredAt: new Date(),
                externalId: 'test_newsletter_today_' + Date.now(),
                metadata: { senderName: 'Test Sender', from: 'test@example.com' }
            }
        });
        console.log('Created today newsletter');

        // Create 'Yesterday' newsletter
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await prisma.updateItem.create({
            data: {
                userId,
                source: 'gmail',
                type: 'newsletter',
                severity: 'info',
                title: 'Test Newsletter: Yesterday',
                body: 'This is a test newsletter from yesterday. Should not show.',
                occurredAt: yesterday,
                externalId: 'test_newsletter_yesterday_' + Date.now(),
                metadata: { senderName: 'Old Sender', from: 'old@example.com' }
            }
        });
        console.log('Created yesterday newsletter');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
