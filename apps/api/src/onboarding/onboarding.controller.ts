import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Post('complete')
    async saveOnboardingResponse(
        @Headers('x-user-id') userId: string,
        @Body() body: {
            userEmail?: string;
            selectedGoals: string[];
            selectedIntegrations: string[];
        }
    ) {
        const uid = userId || 'default-user-id';
        return this.onboardingService.saveResponse({
            userId: uid,
            userEmail: body.userEmail,
            selectedGoals: body.selectedGoals,
            selectedIntegrations: body.selectedIntegrations
        });
    }

    @Get('responses')
    async getAllResponses() {
        return this.onboardingService.getAllResponses();
    }

    @Get('stats')
    async getOnboardingStats() {
        return this.onboardingService.getStats();
    }
}
