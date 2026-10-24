import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { flushCache, getDaemonStatus, restartDaemon, stopDaemon } from './client.js';
import {
  createOutputMessage,
  ensureErrorMessage,
  formatMemory,
  formatUptime,
} from './utils.js';

/** Emits a visible status message when UI is available, otherwise logs to stdout. */
const outputMessage = createOutputMessage('pi-in-memory-cache');

/** Options for the handlers of the commands. */
type HandleCommandOptions = {
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handles `/in-memory-cache-status`: shows the diagnostics of the daemon, or says that it
 * is not running.
 *
 * @param options The context of the command.
 */
export const handleInMemoryCacheStatus = async ({
  ctx,
}: HandleCommandOptions): Promise<void> => {
  const status = await getDaemonStatus();
  if (!status) {
    outputMessage(ctx, 'in-memory-cache: daemon is not running');
    return;
  }
  outputMessage(
    ctx,
    [
      `in-memory-cache daemon status:`,
      `  uptime:  ${formatUptime(status.uptimeMs)}`,
      `  entries: ${status.entries}`,
      `  pid:     ${status.pid}`,
      `  memory:  ${formatMemory(status.memoryRssBytes)}`,
      `  cpu:     user ${status.cpuUserMs}ms / sys ${status.cpuSystemMs}ms`,
    ].join('\n'),
  );
};

/**
 * Handles `/in-memory-cache-stop`: stops the daemon, or says that it is not running.
 *
 * @param options The context of the command.
 */
export const handleInMemoryCacheStop = async ({
  ctx,
}: HandleCommandOptions): Promise<void> => {
  try {
    await stopDaemon();
    outputMessage(ctx, 'in-memory-cache: daemon stopped');
  } catch {
    outputMessage(ctx, 'in-memory-cache: daemon is not running');
  }
};

/**
 * Handles `/in-memory-cache-clean`: flushes all the entries, and says how many there
 * were.
 *
 * @param options The context of the command.
 */
export const handleInMemoryCacheClean = async ({
  ctx,
}: HandleCommandOptions): Promise<void> => {
  try {
    const { cleared } = await flushCache();
    outputMessage(
      ctx,
      `in-memory-cache: cleared ${cleared} ${cleared === 1 ? 'entry' : 'entries'}`,
    );
  } catch (error) {
    outputMessage(ctx, `in-memory-cache: ${ensureErrorMessage(error)}`);
  }
};

/**
 * Handles `/in-memory-cache-restart`: restarts the daemon, or starts it if it was
 * stopped.
 *
 * @param options The context of the command.
 */
export const handleInMemoryCacheRestart = async ({
  ctx,
}: HandleCommandOptions): Promise<void> => {
  try {
    const pid = await restartDaemon();
    outputMessage(ctx, `in-memory-cache: daemon started (pid ${pid})`);
  } catch (error) {
    outputMessage(ctx, `in-memory-cache: restart failed — ${ensureErrorMessage(error)}`);
  }
};
