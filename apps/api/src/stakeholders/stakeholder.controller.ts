import { Controller, Get, Post, Put, Delete, Body, Param, Req, Headers } from '@nestjs/common';
import { StakeholderService } from './stakeholder.service';

@Controller('stakeholders')
export class StakeholderController {
    constructor(private stakeholderService: StakeholderService) { }

    @Get()
    async getAll(@Headers('x-user-id') userId: string) {
        const stakeholders = await this.stakeholderService.findAll(userId || 'default-user-id');
        return stakeholders.map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            organization: s.organization,
            email: s.email,
            frequency: {
                value: s.frequencyValue,
                unit: s.frequencyUnit
            },
            lastContactedAt: s.lastContactedAt,
            nextReachOutAt: s.nextReachOutAt,
            notes: s.notes
        }));
    }

    @Post()
    async create(
        @Headers('x-user-id') userId: string,
        @Body() body: {
            name: string;
            role: string;
            organization?: string;
            email?: string;
            frequency: { value: number; unit: string };
            notes?: string;
        }
    ) {
        const stakeholder = await this.stakeholderService.create(userId || 'default-user-id', {
            name: body.name,
            role: body.role,
            organization: body.organization,
            email: body.email,
            frequencyValue: body.frequency.value,
            frequencyUnit: body.frequency.unit,
            notes: body.notes
        });

        return {
            id: stakeholder.id,
            name: stakeholder.name,
            role: stakeholder.role,
            organization: stakeholder.organization,
            email: stakeholder.email,
            frequency: {
                value: stakeholder.frequencyValue,
                unit: stakeholder.frequencyUnit
            },
            lastContactedAt: stakeholder.lastContactedAt,
            nextReachOutAt: stakeholder.nextReachOutAt,
            notes: stakeholder.notes
        };
    }

    @Put(':id')
    async update(
        @Headers('x-user-id') userId: string,
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            role?: string;
            organization?: string;
            email?: string;
            frequency?: { value: number; unit: string };
            notes?: string;
        }
    ) {
        const updateData: any = { ...body };
        if (body.frequency) {
            updateData.frequencyValue = body.frequency.value;
            updateData.frequencyUnit = body.frequency.unit;
            delete updateData.frequency;
        }

        await this.stakeholderService.update(userId || 'default-user-id', id, updateData);
        return { success: true };
    }

    @Post(':id/log-contact')
    async logContact(
        @Headers('x-user-id') userId: string,
        @Param('id') id: string
    ) {
        const result = await this.stakeholderService.logContact(userId || 'default-user-id', id);
        if (!result) {
            return { success: false, error: 'Stakeholder not found' };
        }
        return {
            success: true,
            lastContactedAt: result.lastContactedAt,
            nextReachOutAt: result.nextReachOutAt
        };
    }

    @Delete(':id')
    async delete(
        @Headers('x-user-id') userId: string,
        @Param('id') id: string
    ) {
        await this.stakeholderService.delete(userId || 'default-user-id', id);
        return { success: true };
    }
}
