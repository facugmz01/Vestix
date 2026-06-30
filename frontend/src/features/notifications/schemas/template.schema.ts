import { z } from 'zod';

export const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'Nombre muy largo'),
  event: z.string().min(1, 'Debe seleccionar un evento'),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'], { message: 'Debe seleccionar un canal' }),
  subject: z.string().optional(),
  body: z.string().min(1, 'El cuerpo del mensaje es obligatorio'),
  isActive: z.boolean().catch(true),
}).superRefine((data, ctx) => {
  if (data.channel === 'EMAIL' && (!data.subject || data.subject.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El asunto es obligatorio para correos electrónicos',
      path: ['subject'],
    });
  }
});

export type TemplateFormData = z.infer<typeof templateSchema>;
