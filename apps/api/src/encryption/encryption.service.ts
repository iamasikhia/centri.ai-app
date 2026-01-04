import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';

    constructor(private configService: ConfigService) { }

    private getKey(): Buffer {
        const key = this.configService.get<string>('ENCRYPTION_KEY');
        if (!key) throw new Error('ENCRYPTION_KEY is not defined');
        // Ensure key is 32 bytes. If string, hash it.
        return crypto.createHash('sha256').update(key).digest();
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    decrypt(text: string): string {
        const parts = text.split(':');
        if (parts.length !== 3) throw new Error('Invalid encrypted text format');
        const [ivHex, authTagHex, encryptedHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
