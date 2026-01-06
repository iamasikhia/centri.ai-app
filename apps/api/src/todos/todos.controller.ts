import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { TodosService } from './todos.service';

import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTodoDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    dueDate?: string;

    @IsOptional()
    @IsEnum(['low', 'medium', 'high'])
    priority?: 'low' | 'medium' | 'high';
}

export class UpdateTodoDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    dueDate?: string;

    @IsOptional()
    @IsEnum(['low', 'medium', 'high'])
    priority?: 'low' | 'medium' | 'high';

    @IsOptional()
    @IsEnum(['pending', 'in_progress', 'completed'])
    status?: 'pending' | 'in_progress' | 'completed';
}

@Controller('todos')
export class TodosController {
    constructor(private readonly todosService: TodosService) { }

    private getUserId(req: any): string {
        return req.headers['x-user-id'] || 'default-user-id';
    }

    @Get()
    async getTodos(@Req() req: any) {
        const userId = this.getUserId(req);
        return this.todosService.getTodos(userId);
    }

    @Get('stats')
    async getTodoStats(@Req() req: any) {
        const userId = this.getUserId(req);
        return this.todosService.getTodoStats(userId);
    }

    @Post()
    async createTodo(@Req() req: any, @Body() dto: CreateTodoDto) {
        const userId = this.getUserId(req);
        return this.todosService.createTodo(userId, dto);
    }

    @Put(':id')
    async updateTodo(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateTodoDto,
    ) {
        const userId = this.getUserId(req);
        return this.todosService.updateTodo(userId, id, dto);
    }

    @Put(':id/complete')
    async completeTodo(@Req() req: any, @Param('id') id: string) {
        const userId = this.getUserId(req);
        return this.todosService.completeTodo(userId, id);
    }

    @Delete(':id')
    async deleteTodo(@Req() req: any, @Param('id') id: string) {
        const userId = this.getUserId(req);
        return this.todosService.deleteTodo(userId, id);
    }
}
