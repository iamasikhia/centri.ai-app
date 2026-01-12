import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const userId = 'default-user-id';

    // Create or Update User (Non-destructive to preserve integrations)
    await prisma.user.upsert({
        where: { id: userId },
        update: {}, // Don't overwrite if exists
        create: {
            id: userId,
            email: 'manager@centri.ai',
            name: 'Manager One',
        }
    });

    // Create Mock Meetings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    await prisma.meeting.createMany({
        data: [
            {
                userId,
                calendarEventId: 'evt_1',
                title: 'Team Sync',
                startTime: new Date(today.setHours(10, 0, 0)),
                endTime: new Date(today.setHours(10, 30, 0)),
                attendeesJson: '[]',
            },
            {
                userId,
                calendarEventId: 'evt_2',
                title: 'Product Review',
                startTime: new Date(today.setHours(14, 0, 0)),
                endTime: new Date(today.setHours(15, 0, 0)),
                attendeesJson: '[]',
            },
            {
                userId,
                calendarEventId: 'evt_3',
                title: '1:1 with Alice',
                startTime: new Date(tomorrow.setHours(11, 0, 0)),
                endTime: new Date(tomorrow.setHours(11, 30, 0)),
                attendeesJson: '[]',
            }
        ]
    });

    // Create Mock Team Members
    await prisma.teamMember.createMany({
        data: [
            { userId, externalId: 'u1', name: 'Alice Dev', email: 'alice@company.com', sourcesJson: '["slack", "github"]' },
            { userId, externalId: 'u2', name: 'Bob Design', email: 'bob@company.com', sourcesJson: '["slack", "jira"]' },
            { userId, externalId: 'u3', name: 'Charlie PM', email: 'charlie@company.com', sourcesJson: '["slack"]' },
        ]
    });

    // Create Mock Tasks
    await prisma.task.createMany({
        data: [
            {
                userId,
                externalId: 't1',
                title: 'Fix critical production bug',
                status: 'In Progress',
                priority: 'High',
                assigneeEmail: 'alice@company.com',
                dueDate: new Date(today), // Due today
                isBlocked: true,
                blockedByJson: '[{"key":"JIRA-123","reason":"API Down"}]'
            },
            {
                userId,
                externalId: 't2',
                title: 'Design new landing page',
                status: 'In Progress',
                priority: 'Medium',
                assigneeEmail: 'bob@company.com',
                dueDate: new Date(tomorrow),
                isBlocked: false,
            },
            {
                userId,
                externalId: 't3',
                title: 'Update roadmap',
                status: 'To Do',
                priority: 'Low',
                assigneeEmail: 'charlie@company.com',
                dueDate: new Date(today.getTime() - 86400000), // Overdue
                isBlocked: false,
            }
        ]
    });

    // Create Mock Integration Status
    await prisma.integrations.create({
        data: {
            userId,
            provider: 'slack',
            encryptedBlob: 'mock_encrypted_blob', // Won't work for real sync but works for status check
            updatedAt: new Date(),
        }
    });

    console.log('Seed data created for user:', userId);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
