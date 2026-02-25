import { EventEmitter } from 'events';
import { type FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// Next.js has a bug where a new EventEmitter is created on every hot-reload.
// This is a workaround to ensure that the same emitter is used across hot-reloads.
const globalWithEmitter = global as typeof global & {
  errorEmitter: EventEmitter<Events>;
};

export const errorEmitter: EventEmitter<Events> =
  globalWithEmitter.errorEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalWithEmitter.errorEmitter = errorEmitter;
}
