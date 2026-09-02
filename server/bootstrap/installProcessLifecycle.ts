import { createLogger } from '../logger';
import { installProcessLifecycleHandlers } from './processLifecycle';

// Must execute before server.application.ts registers any application work. Fatal process
// events are latched first, then delegated to the application's existing bounded SIGTERM
// shutdown path. The lifecycle module also forces the final exit code to remain non-zero.
installProcessLifecycleHandlers(createLogger('process-lifecycle'));
