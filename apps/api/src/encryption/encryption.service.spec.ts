import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            if (key === 'ENCRYPTION_KEY') return 'my-secret-key-that-is-very-secure';
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should encrypt and decrypt correctly', () => {
        const original = 'Hello World';
        const encrypted = service.encrypt(original);
        expect(encrypted).not.toBe(original);
        expect(encrypted).toContain(':');

        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(original);
    });

    it('should throw error on invalid decrypt format', () => {
        expect(() => service.decrypt('invalid_string')).toThrow();
    });
});
