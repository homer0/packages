import type {
  BeforeAgentStartEvent,
  BeforeAgentStartEventResult,
  ExtensionCommandContext,
  ExtensionContext,
  ExtensionAPI,
  ResourcesDiscoverResult,
  SessionStartEvent,
} from '@earendil-works/pi-coding-agent';
import {
  discoverProfileResources,
  loadProfileExtensions,
  resolveProfilePackageResources,
} from './resources.js';
import type { ProfileLibOptions, ProfilesRuntime } from './types.js';
import {
  createOutputMessage,
  resolveEnabledProfiles,
  showAnnouncementWidget,
} from './utils.js';

/** Emits a visible status message when UI is available, otherwise logs to stdout. */
export const outputMessage = createOutputMessage('pi-profiles');

/**
 * Builds the options that make the profile functions use the directory of the session and
 * report their non-fatal issues through its output.
 *
 * @param ctx The context of the session.
 * @returns The options for the profile functions.
 */
export const forSession = (ctx: ExtensionContext): ProfileLibOptions => ({
  cwd: ctx.cwd,
  onError: (message) => outputMessage(ctx, message),
});

/** Options for {@link handleBeforeAgentStart}. */
type HandleBeforeAgentStartOptions = {
  /** The `before_agent_start` event. */
  event: BeforeAgentStartEvent;
  /** The context of the session. */
  ctx: ExtensionContext;
};

/**
 * Handler for `before_agent_start`: appends the `AGENTS.md` content of the enabled
 * profiles to the system prompt.
 *
 * @param options The event and the context.
 * @returns The new system prompt, or `undefined` if there's nothing to append.
 */
export const handleBeforeAgentStart = async ({
  event,
  ctx,
}: HandleBeforeAgentStartOptions): Promise<BeforeAgentStartEventResult | undefined> => {
  const resources = await discoverProfileResources(forSession(ctx));
  if (resources.agentsFiles.length === 0) return undefined;

  const profileContext = resources.agentsFiles
    .map((file) => `## ${file.path}\n\n${file.content.trim()}`)
    .join('\n\n');

  return {
    systemPrompt: `${event.systemPrompt}\n\n# Profile Context\n\n${profileContext}`,
  };
};

/** Options for {@link handleResourcesDiscover}. */
type HandleResourcesDiscoverOptions = {
  /** The context of the session. */
  ctx: ExtensionContext;
};

/**
 * Handler for `resources_discover`: contributes the skills, prompt templates and themes
 * of the enabled profiles and of their packages.
 *
 * @param options The context.
 * @returns The resource paths, or `undefined` if no profile is enabled.
 */
export const handleResourcesDiscover = async ({
  ctx,
}: HandleResourcesDiscoverOptions): Promise<ResourcesDiscoverResult | undefined> => {
  const resources = await discoverProfileResources(forSession(ctx));
  if (resources.names.length === 0) return undefined;

  const packageResources = await resolveProfilePackageResources({
    packages: resources.packages,
    ...forSession(ctx),
  });

  return {
    skillPaths: [...resources.skillPaths, ...packageResources.skillPaths],
    promptPaths: packageResources.promptPaths,
    themePaths: packageResources.themePaths,
  };
};

const WIDGET_KEY = 'profiles-announcement';

/**
 * Announces the enabled profiles with a widget, if there are any.
 *
 * @param pi The Pi extension API.
 * @param ctx The context of the session.
 */
const announceConfiguredProfiles = async (
  pi: ExtensionAPI,
  ctx: ExtensionContext,
): Promise<void> => {
  const names = await resolveEnabledProfiles(forSession(ctx));
  if (names.length === 0) return;

  showAnnouncementWidget({
    pi,
    ctx,
    key: WIDGET_KEY,
    label: 'Profiles',
    value: names.join(', '),
  });
};

/** Options for {@link handleSessionStart}. */
type HandleSessionStartOptions = {
  /** The runtime of the extension. */
  runtime: ProfilesRuntime;
  /** The `session_start` event. */
  event: SessionStartEvent;
  /** The context of the session. */
  ctx: ExtensionContext;
};

/**
 * Handler for `session_start`: announces the enabled profiles, records the discovered
 * ones in `runtime.state`, and loads the extensions of their packages.
 *
 * @param options The runtime, the event, and the context.
 */
export const handleSessionStart = async ({
  runtime,
  event,
  ctx,
}: HandleSessionStartOptions): Promise<void> => {
  const { pi, state } = runtime;
  await announceConfiguredProfiles(pi, ctx);
  const resources = await discoverProfileResources(forSession(ctx));
  state.sessionProfiles = resources.names;
  if (resources.packages.length > 0) {
    await loadProfileExtensions(pi, {
      packages: resources.packages,
      sessionStartEvent: event,
      ctx,
      ...forSession(ctx),
    });
  }
};

/** Options for {@link handleProfilesStatus}. */
type HandleProfilesStatusOptions = {
  /** The runtime of the extension. */
  runtime: ProfilesRuntime;
  /** The context of the command. */
  ctx: ExtensionCommandContext;
};

/**
 * Handles `/profiles-status`: shows the profiles loaded in this session.
 *
 * @param options The runtime and the context.
 */
export const handleProfilesStatus = ({
  runtime,
  ctx,
}: HandleProfilesStatusOptions): void => {
  const { sessionProfiles } = runtime.state;
  const message =
    sessionProfiles.length === 0
      ? 'No profiles loaded'
      : `Profiles loaded: ${sessionProfiles.join(', ')}`;
  outputMessage(ctx, message);
};
