import { z } from 'zod'

export const UUID = z.string().uuid()
export const DateISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const TimestampISO = z.string().regex(/^\d{4}-\d{2}-\d{2}T/)
export const Period = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

export const EnrollmentSchema = z.object({
  turmaId: UUID,
  status: z.enum(['ACTIVE', 'INACTIVE', 'DROPPED']).optional(),
  startDate: DateISO.optional().nullable(),
  endDate: DateISO.optional().nullable(),
  customMonthlyFeeCents: z.number().int().optional().nullable()
})

export const StudentSchema = z.object({
  id: UUID.optional(),
  full_name: z.string().min(3).max(160),
  nickname: z.string().max(160).optional().nullable(),
  cpf: z.string().regex(/^\d{11}$/),
  birth_date: DateISO.optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).max(20).optional().nullable(),
  enrollment_date: DateISO,
  status: z.enum(['ATIVO', 'INATIVO']),
  notes: z.string().max(5000).optional().nullable(),
  currentGraduationId: UUID.optional().nullable(),
  activityTypeId: UUID.optional(),
  activityTypeIds: z.array(UUID).optional(),
  turmaIds: z.array(UUID).optional(),
  scheduleIds: z.array(UUID).optional(),
  enrollments: z.array(EnrollmentSchema).optional()
})

export const AddressSchema = z.object({
  id: UUID.optional(),
  student_id: UUID.optional(),
  street: z.string().min(1).max(160),
  number: z.string().min(1).max(20).optional(),
  complement: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  city: z.string().min(1).max(80),
  state: z.string().length(2),
  zip_code: z.string().regex(/^\d{8}$/),
  country: z.string().default('BR')
})

export const GraduationSchema = z.object({
  id: UUID.optional(),
  student_id: UUID.optional(),
  type: z.enum(['CORDA', 'COR', 'GRAU']),
  level: z.string().min(1).max(80),
  date: DateISO,
  teacher: z.string().max(160).optional(),
  notes: z.string().max(1000).optional()
})

export const PaymentSchema = z.object({
  id: UUID.optional(),
  student_id: UUID.optional(),
  monthly_fee: z.string().regex(/^\d+(\.\d{1,2})?$/),
  due_day: z.number().int().min(1).max(31),
  period: Period,
  status: z.enum(['PAGO', 'EM_ABERTO', 'ATRASADO']).optional(),
  paid_at: TimestampISO.optional(),
  method: z.enum(['DINHEIRO', 'PIX', 'CARTAO']).optional(),
  notes: z.string().max(1000).optional()
})

export type Student = z.infer<typeof StudentSchema>
export type Address = z.infer<typeof AddressSchema>
export type Graduation = z.infer<typeof GraduationSchema>
export type Payment = z.infer<typeof PaymentSchema>

export const UserSchema = z.object({
  id: UUID.optional(),
  organizationId: UUID.optional(),
  name: z.string().min(1).max(160),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'PROFESSOR']),
  relatedId: z.string().optional()
})

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128)
})

export type User = z.infer<typeof UserSchema>
