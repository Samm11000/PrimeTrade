const { z } = require('zod');

const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),

  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().default(''),

  status: z.enum(['pending', 'in-progress', 'completed']).optional().default('pending'),

  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),

  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO 8601 (e.g. 2024-12-31T00:00:00Z)' })
    .optional()
    .nullable(),
});

const updateTaskSchema = createTaskSchema.partial();

module.exports = { createTaskSchema, updateTaskSchema };
