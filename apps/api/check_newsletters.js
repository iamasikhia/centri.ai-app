
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const newsletters = await prisma.updateItem.findMany({
            where: { type: 'newsletter' },
            orderBy: { occurredAt: 'desc' }
        });

        console.log(`Found ${newsletters.length} newsletters in DB.`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todays = newsletters.filter(n => new Date(n.occurredAt) >= today);
        console.log(`Found ${todays.length} newsletters from today (${today.toISOString()}).`);

        newsletters.forEach(n => {
            console.log(`[${n.id}] ${n.title} - ${n.occurredAt} (Dismissed: ${n.isDismissed})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
