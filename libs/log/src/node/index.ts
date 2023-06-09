import { type CreateLoggerFactoryParams, createLoggerFactory } from '../create-logger-factory';
import {
  type DefaultLoggerLevel,
  DEFAULT_LOGGER_LEVELS,
  DEFAULT_LOGGER_PARAMS,
  LOGGER_SILENT_LEVEL
} from '../shared';
import { printf, readArguments } from '../utils';
import { createJsonTarget } from './create-json-target';
import { createPrettyTarget } from './create-pretty-target';
import { NODE_LOGGER_SYSTEM_INFO } from './system-info';

export type { JsonStreamOptions } from './create-json-target';
export type { PrettyStreamOptions } from './create-pretty-target';

export {
  type CreateLoggerFactoryParams,
  type DefaultLoggerLevel,
  createJsonTarget,
  createLoggerFactory,
  createPrettyTarget,
  DEFAULT_LOGGER_LEVELS,
  DEFAULT_LOGGER_PARAMS,
  LOGGER_SILENT_LEVEL,
  NODE_LOGGER_SYSTEM_INFO
};

export const createLogger = createLoggerFactory<DefaultLoggerLevel>({
  defaultParams: {
    ...DEFAULT_LOGGER_PARAMS,
    meta: NODE_LOGGER_SYSTEM_INFO,
    target: process.env.NODE_ENV === 'production' ? createJsonTarget() : createPrettyTarget()
  },
  formatMessage: printf,
  readArguments
});
