import { EventEvaluationSchema } from '#database/schema'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'

export default class EventEvaluation extends compose(EventEvaluationSchema, SoftDeletes) {}
