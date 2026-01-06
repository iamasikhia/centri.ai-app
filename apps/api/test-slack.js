
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');
const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super_secret_encryption_key_32_chars_long';
const ALGORITHM = 'aes-256-gcm';

function getKey() {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function decrypt(text) {
    const parts = text.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted text format (expected iv:tag:content)');
    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function checkSlack() {
    const slackInteg = await prisma.integrations.findFirst({
        where: { provider: 'slack' }
    });

    if (!slackInteg) {
        console.log("No slack integration found in DB.");
        return;
    }

    let token;
    try {
        const decrypted = decrypt(slackInteg.encryptedBlob);
        const t = JSON.parse(decrypted);
        token = t.access_token;
        console.log("Token decrypted successfully. Starts with:", token.substring(0, 10));
    } catch (e) {
        console.error("Failed to decrypt:", e.message);
        return;
    }

    try {
        console.log("Testing auth.test...");
        const res = await axios.post('https://slack.com/api/auth.test', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("auth.test result:", res.data);
        if (!res.data.ok) {
            console.log("Token is INVALID.");
        } else {
            console.log("Token is VALID.");
        }
    } catch (e) {
        console.error("auth.test failed:", e.message);
    }

    // Test conversations.list
    try {
        console.log("Testing conversations.list...");
        const res = await axios.get('https://slack.com/api/conversations.list?limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("conversations.list ok:", res.data.ok);
        if (!res.data.ok) console.log("Error:", res.data.error);
        else {
            console.log("Channels count:", res.data.channels?.length);
            if (res.data.channels && res.data.channels.length > 0) {
                const prev = res.data.channels[0];
                console.log(`Checking history for channel ${prev.name} (${prev.id})...`);
                const histRes = await axios.get('https://slack.com/api/conversations.history', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { channel: prev.id, limit: 5 }
                });
                console.log("History ok:", histRes.data.ok);
                console.log("Messages:", histRes.data.messages?.length);
                if (histRes.data.messages) {
                    console.log("First msg:", histRes.data.messages[0]);
                }
            }
        }
    } catch (e) {
        console.error("conversations.list failed:", e.message);
    }
}

checkSlack()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
