import vine from '@vinejs/vine'

const fields = {
  name: vine.string().trim().minLength(3).maxLength(160),
  startsOn: vine.date({ formats: ['YYYY-MM-DD'] }),
  endsOn: vine.date({ formats: ['YYYY-MM-DD'] }).afterOrSameAs('startsOn'),
  location: vine.string().trim().maxLength(200).nullable().optional(),
  hashtag: vine
    .string()
    .trim()
    .maxLength(80)
    .regex(/^#?[\p{L}\p{N}_]+$/u)
    .transform((value) => (!value || value.startsWith('#') ? value : `#${value}`))
    .nullable()
    .optional(),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
}

export const createEventValidator = vine.create(fields)

export const updateEventValidator = vine.create(fields)
