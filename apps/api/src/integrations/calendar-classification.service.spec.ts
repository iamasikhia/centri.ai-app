
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarClassificationService } from './calendar-classification.service';
import { ConfigService } from '@nestjs/config';

describe('CalendarClassificationService', () => {
    let service: CalendarClassificationService;

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'OPENAI_API_KEY') return 'mock-key';
            return null;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalendarClassificationService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<CalendarClassificationService>(CalendarClassificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should classify "Daily Standup" as Meeting (keyword)', async () => {
        const result = await service.classify({
            title: 'Daily Standup',
            description: '',
            attendeesCount: 1,
            hasConference: false,
            isSelfOrganized: true,
            durationMinutes: 15,
        });
        expect(result.type).toBe('meeting');
        expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify "Deep Work: Coding" as Task (keyword + solo)', async () => {
        const result = await service.classify({
            title: 'Deep Work: Coding',
            description: '',
            attendeesCount: 1,
            hasConference: false,
            isSelfOrganized: true,
            durationMinutes: 60,
        });
        expect(result.type).toBe('task');
        expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify multi-attendee event as Meeting', async () => {
        const result = await service.classify({
            title: 'Project Discussion',
            description: '',
            attendeesCount: 3,
            hasConference: false,
            isSelfOrganized: true,
            durationMinutes: 30,
        });
        expect(result.type).toBe('meeting');
        expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify event with conference link as Meeting', async () => {
        const result = await service.classify({
            title: 'Quick Syncer',
            description: '',
            attendeesCount: 1, // Maybe just me and link
            hasConference: true,
            isSelfOrganized: true,
            durationMinutes: 30,
        });
        expect(result.type).toBe('meeting');
        expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify "Submit Report" as Task (verb + solo)', async () => {
        const result = await service.classify({
            title: 'Submit Expense Report',
            description: '',
            attendeesCount: 1,
            hasConference: false,
            isSelfOrganized: true,
            durationMinutes: 15
        });
        expect(result.type).toBe('task');
    });

    // For ambiguous cases, it hits LLM. Since we didn't mock OpenAI instance method nicely (private prop),
    // we expect it to fallback or try to call and fail (mock key).
    // If it fails, it defaults to meeting, confidence 0.5.
    it('should fallback to meeting for ambiguous "Randome Event" if LLM fails/mocks', async () => {
        // We expect console.error here essentially, or we can spyOn console.error to suppress
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await service.classify({
            title: 'Random Event X',
            description: '',
            attendeesCount: 1,
            hasConference: false,
            isSelfOrganized: true,
            durationMinutes: 30
        });
        // The service logic: if rule-based < 0.8, calls LLM. 
        // "Random Event X" has no keywords. So defaults to meeting, conf 0.4.
        // Then calls LLM. LLM fails (bad key). Catch returns meeting 0.5.
        expect(result.type).toBe('meeting');
        expect(result.confidence).toBeLessThan(0.8);
    });
});
