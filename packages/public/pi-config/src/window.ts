import {
  highlightCode,
  type ExtensionCommandContext,
  type Theme,
} from '@earendil-works/pi-coding-agent';
import {
  type Component,
  Editor,
  type EditorTheme,
  Key,
  matchesKey,
  truncateToWidth,
  type TUI,
  visibleWidth,
} from '@earendil-works/pi-tui';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  getConfig,
  getSessionConfigOverride,
  readConfigFiles,
  setSessionConfigOverride,
} from './fns.js';
import type { PiCoreConfig } from './types.js';
import { ensureErrorMessage } from './utils/index.js';

/** The title shown in the top border of the window. */
const WINDOW_TITLE = 'Config';
/** The labels of the tabs, in order. */
const TAB_LABELS = ['Effective config', 'Override'] as const;
/** The key that toggles the override on the effective config tab. */
const TOGGLE_OVERRIDE_KEY = 't';
/** The language used to highlight the config. */
const YAML_LANGUAGE = 'yaml';
/** The lines shown on the effective config tab while the config is loading. */
const LOADING_LINES = ['Loading…'];

/** The theme color for the border of the window. */
const BORDER_COLOR = 'borderAccent';
/** Columns spent on the left/right border chars and their padding: `│ ` + ` │`. */
const BORDER_OVERHEAD_WIDTH = 4;
/** Columns spent on the top/bottom border corner chars: `┌`/`┐` or `└`/`┘`. */
const BORDER_CORNER_WIDTH = 2;

/** The width of the window, relative to the terminal. */
const OVERLAY_WIDTH = '90%';
/** The max height of the window, relative to the terminal. */
const OVERLAY_MAX_HEIGHT = '85%';
/**
 * The same max height as {@link OVERLAY_MAX_HEIGHT}, as a ratio, to calculate how many
 * lines of content fit in the window.
 */
const OVERLAY_HEIGHT_RATIO = 0.85;
/** The minimum number of content lines to show, even in very short terminals. */
const MIN_VISIBLE_CONTENT_LINES = 5;
/**
 * Chrome lines around tab 1's scrollable YAML body: outer border/tab-bar/blanks (4) plus
 * tab 1's own status/blank/blank/hint (4).
 */
const EFFECTIVE_TAB_CHROME_LINES = 8;

/** Which `/config` window tab is focused: 0 = effective config, 1 = override editor. */
type ConfigTab = 0 | 1;

/** Feedback shown under the override editor after an Enter-submit attempt. */
type OverrideMessage = {
  /** Whether the submit worked, to pick the color of the message. */
  kind: 'success' | 'error';
  /** The text to show. */
  text: string;
};

/** Result of parsing tab 2's editor content into a new session override. */
type OverrideParseResult = {
  /** The new override. It's `undefined` when the override should be cleared, or on error. */
  override?: PiCoreConfig;
  /** The feedback for the user. */
  message: OverrideMessage;
};

/**
 * Mutable state for one open `/config` window. Held as a plain object (rather than
 * closure-local variables) so the render/input-handling functions can stay pure and be
 * composed instead of nesting all logic inside the window factory.
 */
type ConfigWindowState = {
  /** The tab that is focused. */
  activeTab: ConfigTab;
  /** Whether the effective config tab shows the session override applied. */
  showOverride: boolean;
  /** First visible line index into tab 1's current YAML text (manual scroll position). */
  scrollOffset: number;
  /** Syntax-highlighted lines for the file-based config, once loaded. */
  fileConfigLines?: string[];
  /** Syntax-highlighted lines for the override-inclusive effective config, once loaded. */
  effectiveConfigLines?: string[];
  /** The feedback of the last submit on the override tab, if there's one. */
  overrideMessage?: OverrideMessage;
};

/** Shared render context passed to the `/config` window's tab renderers. */
type ConfigWindowRenderContext = {
  /** The theme to color the window with. */
  theme: Theme;
  /** The state of the window. */
  state: ConfigWindowState;
  /** The editor of the override tab. */
  editor: Editor;
  /** Usable width inside the window's left/right border. */
  innerWidth: number;
  /** How many lines of the config fit in the effective config tab. */
  visibleContentLines: number;
};

/** Options for {@link createConfigWindowInputHandler}. */
type ConfigWindowInputHandlerOptions = {
  /** The state of the window, which the handler updates. */
  state: ConfigWindowState;
  /** The editor of the override tab, which receives the input of that tab. */
  editor: Editor;
  /** The TUI, to know the size of the terminal. */
  tui: TUI;
  /** Re-renders the window. */
  refresh: () => void;
  /** Closes the window. */
  close: () => void;
};

/** Options for {@link createConfigWindow}. */
type CreateConfigWindowOptions = {
  /** The TUI that will render the window. */
  tui: TUI;
  /** The theme to color the window with. */
  theme: Theme;
  /** Closes the window. */
  done: (result: unknown) => void;
};

/**
 * Adapts Pi's theme object to the embedded editor theme.
 *
 * @param theme Pi's theme.
 * @returns The theme for the editor.
 */
const createEditorTheme = (theme: Theme): EditorTheme => ({
  borderColor: (text) => theme.fg('accent', text),
  selectList: {
    selectedPrefix: (text) => theme.fg('accent', text),
    selectedText: (text) => theme.fg('accent', text),
    description: (text) => theme.fg('muted', text),
    scrollInfo: (text) => theme.fg('dim', text),
    noMatch: (text) => theme.fg('warning', text),
  },
});

/**
 * Renders the current session-override status line for tab 1.
 *
 * @param showOverride Whether the tab is showing the override applied.
 * @returns The text of the status line.
 */
const getStatusText = (showOverride: boolean): string => {
  const override = getSessionConfigOverride();
  if (!override) return 'No session override set';
  return showOverride
    ? 'Session override set — shown (t to hide)'
    : 'Session override set — hidden (t to show)';
};

/**
 * Parses tab 2's editor content into a new override, or reports why it was rejected.
 *
 * @param value The content of the editor.
 * @returns The new override (or none, if it should be cleared) and the feedback for the
 *   user.
 */
const parseOverrideInput = (value: string): OverrideParseResult => {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      override: undefined,
      message: { kind: 'success', text: 'Session override cleared.' },
    };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(trimmed);
  } catch (error) {
    return {
      override: undefined,
      message: { kind: 'error', text: `Invalid YAML: ${ensureErrorMessage(error)}` },
    };
  }

  if (typeof parsed === 'undefined' || parsed === null) {
    return {
      override: undefined,
      message: { kind: 'success', text: 'Session override cleared.' },
    };
  }

  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    return {
      override: parsed as PiCoreConfig,
      message: { kind: 'success', text: 'Session override applied.' },
    };
  }

  return {
    override: undefined,
    message: { kind: 'error', text: 'Override must be a YAML mapping (object).' },
  };
};

/**
 * Loads the file-based config, syntax-highlighted, or an error message on failure.
 *
 * @returns The lines to show.
 */
const loadFileConfigLines = async (): Promise<string[]> => {
  try {
    const { config } = await readConfigFiles();
    return highlightCode(stringifyYaml(config), YAML_LANGUAGE);
  } catch (error) {
    return [`Failed to load config: ${ensureErrorMessage(error)}`];
  }
};

/**
 * Loads the override-inclusive effective config, syntax-highlighted, or an error message
 * on failure.
 *
 * @returns The lines to show.
 */
const loadEffectiveConfigLines = async (): Promise<string[]> => {
  try {
    return highlightCode(stringifyYaml(await getConfig()), YAML_LANGUAGE);
  } catch (error) {
    return [`Failed to load config: ${ensureErrorMessage(error)}`];
  }
};

/**
 * Gets how many YAML content lines fit in the window, given the terminal's height.
 *
 * @param tui The TUI, to know the size of the terminal.
 * @returns The number of lines.
 */
const getVisibleContentLineCount = (tui: TUI): number =>
  Math.max(
    MIN_VISIBLE_CONTENT_LINES,
    Math.floor(tui.terminal.rows * OVERLAY_HEIGHT_RATIO) - EFFECTIVE_TAB_CHROME_LINES,
  );

/**
 * Gets tab 1's current syntax-highlighted YAML lines.
 *
 * @param state The state of the window.
 * @returns The lines, or a loading message if they are not ready yet.
 */
const getEffectiveTabLines = (state: ConfigWindowState): string[] =>
  (state.showOverride ? state.effectiveConfigLines : state.fileConfigLines) ??
  LOADING_LINES;

/**
 * Clamps a scroll offset to the valid range for the given content/viewport sizes.
 *
 * @param scrollOffset The offset to clamp.
 * @param lineCount The total number of lines of the content.
 * @param visibleContentLines How many lines of the content fit in the window.
 * @returns The offset, within the valid range.
 */
const clampScrollOffset = (
  scrollOffset: number,
  lineCount: number,
  visibleContentLines: number,
): number =>
  Math.min(Math.max(0, scrollOffset), Math.max(0, lineCount - visibleContentLines));

/**
 * Renders the window's top border row, with the title embedded.
 *
 * @param theme The theme to color the border with.
 * @param width The width of the window.
 * @returns The line.
 */
const renderTopBorder = (theme: Theme, width: number): string => {
  const prefix = `┌─ ${WINDOW_TITLE} `;
  const fillCount = Math.max(0, width - visibleWidth(prefix) - 1);
  return theme.fg(BORDER_COLOR, `${prefix}${'─'.repeat(fillCount)}┐`);
};

/**
 * Renders the window's bottom border row.
 *
 * @param theme The theme to color the border with.
 * @param width The width of the window.
 * @returns The line.
 */
const renderBottomBorder = (theme: Theme, width: number): string =>
  theme.fg(BORDER_COLOR, `└${'─'.repeat(Math.max(0, width - BORDER_CORNER_WIDTH))}┘`);

/**
 * Wraps one body line with the window's left/right border, padded to `innerWidth`.
 *
 * @param theme The theme to color the border with.
 * @param line The line to wrap.
 * @param innerWidth The usable width inside the borders.
 * @returns The wrapped line.
 */
const wrapBodyLine = (theme: Theme, line: string, innerWidth: number): string => {
  const truncated = truncateToWidth(line, innerWidth);
  const padding = ' '.repeat(Math.max(0, innerWidth - visibleWidth(truncated)));
  return `${theme.fg(BORDER_COLOR, '│')} ${truncated}${padding} ${theme.fg(BORDER_COLOR, '│')}`;
};

/**
 * Renders the tab bar row, highlighting the active tab.
 *
 * @param theme The theme to color the tabs with.
 * @param activeTab The tab that is focused.
 * @returns The line.
 */
const renderTabBar = (theme: Theme, activeTab: ConfigTab): string =>
  TAB_LABELS.map((label, index) => {
    const active = index === activeTab;
    return theme.fg(active ? 'accent' : 'muted', active ? `[${label}]` : ` ${label} `);
  }).join('  ');

/**
 * Renders tab 1 ("Effective config") body lines, scrolled to the current offset.
 *
 * @param context The render context, with only the properties this tab uses.
 * @returns The lines of the tab.
 */
const renderEffectiveConfigTab = ({
  theme,
  state,
  visibleContentLines,
}: Pick<
  ConfigWindowRenderContext,
  'theme' | 'state' | 'visibleContentLines'
>): string[] => {
  const lines: string[] = [];
  lines.push(theme.fg('muted', getStatusText(state.showOverride)));
  lines.push('');

  const allLines = getEffectiveTabLines(state);
  const offset = clampScrollOffset(
    state.scrollOffset,
    allLines.length,
    visibleContentLines,
  );
  lines.push(...allLines.slice(offset, offset + visibleContentLines));

  lines.push('');
  const scrollHint =
    allLines.length > visibleContentLines
      ? `(${offset + 1}-${Math.min(offset + visibleContentLines, allLines.length)}/${allLines.length}) ↑↓/PgUp/PgDn scroll • `
      : '';
  lines.push(
    theme.fg('dim', `${scrollHint}Tab switch tab • t toggle override • Esc close`),
  );
  return lines;
};

/**
 * Renders tab 2 ("Override") body lines.
 *
 * @param context The render context.
 * @returns The lines of the tab.
 */
const renderOverrideTab = ({
  theme,
  state,
  editor,
  innerWidth,
}: ConfigWindowRenderContext): string[] => {
  const lines: string[] = [];
  lines.push(theme.fg('muted', 'Session override (YAML). Empty clears it.'));
  lines.push('');
  lines.push(...editor.render(innerWidth));
  if (state.overrideMessage) {
    lines.push('');
    lines.push(
      theme.fg(
        state.overrideMessage.kind === 'error' ? 'warning' : 'success',
        state.overrideMessage.text,
      ),
    );
  }
  lines.push('');
  lines.push(
    theme.fg(
      'dim',
      'Enter apply/clear • Shift+Enter newline • Tab switch tab • Esc close',
    ),
  );
  return lines;
};

/**
 * Renders the full `/config` window for the given terminal width.
 *
 * @param context The render context.
 * @param width The width of the window.
 * @returns The lines of the window.
 */
const renderConfigWindow = (
  context: ConfigWindowRenderContext,
  width: number,
): string[] => {
  const { theme, state } = context;
  const bodyLines = [
    renderTabBar(theme, state.activeTab),
    '',
    ...(state.activeTab === 0
      ? renderEffectiveConfigTab(context)
      : renderOverrideTab(context)),
  ];
  const lines = [
    renderTopBorder(theme, width),
    ...bodyLines.map((line) => wrapBodyLine(theme, line, context.innerWidth)),
    renderBottomBorder(theme, width),
  ];
  return lines.map((line) => truncateToWidth(line, width));
};

/**
 * Builds the `handleInput` handler for an open `/config` window.
 *
 * @param options The state and the actions the handler needs.
 * @returns The handler, which receives the raw input of the terminal.
 */
const createConfigWindowInputHandler =
  ({
    state,
    editor,
    tui,
    refresh,
    close,
  }: ConfigWindowInputHandlerOptions): ((data: string) => void) =>
  (data) => {
    if (matchesKey(data, Key.escape)) {
      close();
      return;
    }
    if (matchesKey(data, Key.tab) || matchesKey(data, Key.shift('tab'))) {
      state.activeTab = state.activeTab === 0 ? 1 : 0;
      refresh();
      return;
    }
    if (state.activeTab === 0) {
      if (data.toLowerCase() === TOGGLE_OVERRIDE_KEY) {
        state.showOverride = !state.showOverride;
        state.scrollOffset = 0;
        refresh();
        return;
      }

      const visibleContentLines = getVisibleContentLineCount(tui);
      const lineCount = getEffectiveTabLines(state).length;
      let scrollOffset: number | undefined;
      if (matchesKey(data, Key.up)) scrollOffset = state.scrollOffset - 1;
      else if (matchesKey(data, Key.down)) scrollOffset = state.scrollOffset + 1;
      else if (matchesKey(data, Key.pageUp))
        scrollOffset = state.scrollOffset - visibleContentLines;
      else if (matchesKey(data, Key.pageDown))
        scrollOffset = state.scrollOffset + visibleContentLines;
      else if (matchesKey(data, Key.home)) scrollOffset = 0;
      else if (matchesKey(data, Key.end)) scrollOffset = lineCount;

      if (typeof scrollOffset !== 'undefined') {
        state.scrollOffset = clampScrollOffset(
          scrollOffset,
          lineCount,
          visibleContentLines,
        );
        refresh();
      }
      return;
    }
    editor.handleInput(data);
    refresh();
  };

/**
 * Creates the `/config` window component: a 2-tab effective-config/override viewer.
 *
 * @param options The TUI, the theme, and the function to close the window.
 * @returns The component.
 */
const createConfigWindow = ({
  tui,
  theme,
  done,
}: CreateConfigWindowOptions): Component => {
  const state: ConfigWindowState = { activeTab: 0, showOverride: false, scrollOffset: 0 };
  let cachedLines: string[] | undefined;
  let cachedWidth: number | undefined;

  const editor = new Editor(tui, createEditorTheme(theme));
  const currentOverride = getSessionConfigOverride();
  if (currentOverride) editor.setText(stringifyYaml(currentOverride));

  const refresh = (): void => {
    cachedLines = undefined;
    tui.requestRender();
  };

  loadFileConfigLines().then((lines) => {
    state.fileConfigLines = lines;
    refresh();
  });
  loadEffectiveConfigLines().then((lines) => {
    state.effectiveConfigLines = lines;
    refresh();
  });

  editor.onSubmit = (value) => {
    const { override, message } = parseOverrideInput(value);
    if (message.kind === 'success') {
      setSessionConfigOverride(override);
      editor.setText(override ? stringifyYaml(override) : '');
    } else {
      // submitValue() clears the editor before calling onSubmit; restore the rejected
      // text so the user can fix it instead of retyping from scratch.
      editor.setText(value);
    }
    state.overrideMessage = message;
    loadEffectiveConfigLines().then((lines) => {
      state.effectiveConfigLines = lines;
      refresh();
    });
    refresh();
  };

  const handleInput = createConfigWindowInputHandler({
    state,
    editor,
    tui,
    refresh,
    close: () => done(undefined),
  });

  return {
    render: (width) => {
      if (cachedLines && cachedWidth === width) return cachedLines;
      const innerWidth = Math.max(1, width - BORDER_OVERHEAD_WIDTH);
      cachedLines = renderConfigWindow(
        {
          theme,
          state,
          editor,
          innerWidth,
          visibleContentLines: getVisibleContentLineCount(tui),
        },
        width,
      );
      cachedWidth = width;
      return cachedLines;
    },
    invalidate: () => {
      cachedLines = undefined;
    },
    handleInput,
  };
};

/**
 * Opens the `/config` window, or reports that interactive UI is required.
 *
 * @param ctx The context of the command that opened the window.
 */
const showConfigWindow = async (ctx: ExtensionCommandContext): Promise<void> => {
  if (!ctx.hasUI) {
    ctx.ui.notify('/config requires interactive mode UI', 'warning');
    return;
  }
  await ctx.ui.custom<unknown>(
    (tui, theme, _keybindings, done) => createConfigWindow({ tui, theme, done }),
    {
      overlay: true,
      overlayOptions: {
        width: OVERLAY_WIDTH,
        maxHeight: OVERLAY_MAX_HEIGHT,
        anchor: 'center',
      },
    },
  );
};

export { showConfigWindow };
