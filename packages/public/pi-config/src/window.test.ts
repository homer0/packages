import { visibleWidth } from '@earendil-works/pi-tui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stringify as stringifyYaml } from 'yaml';

const {
  state,
  getConfig,
  readConfigFiles,
  getSessionConfigOverride,
  setSessionConfigOverride,
  FakeEditor,
} = vi.hoisted(() => {
  const overrideState: { override: unknown } = { override: undefined };

  /** A minimal stand-in for Pi's editor, to see what the window does with it. */
  class EditorStub {
    static instances: EditorStub[] = [];

    text = '';

    inputs: string[] = [];

    onSubmit?: (value: string) => void;

    constructor(
      public tui: unknown,
      public theme: {
        borderColor: (text: string) => string;
        selectList: Record<string, (text: string) => string>;
      },
    ) {
      EditorStub.instances.push(this);
    }

    setText(text: string): void {
      this.text = text;
    }

    handleInput(data: string): void {
      this.inputs.push(data);
    }

    render(width: number): string[] {
      return [`editor(${width}): ${this.text}`];
    }
  }

  return {
    state: overrideState,
    getConfig: vi.fn(),
    readConfigFiles: vi.fn(),
    getSessionConfigOverride: vi.fn(() => overrideState.override),
    setSessionConfigOverride: vi.fn((value: unknown) => {
      overrideState.override = value;
    }),
    FakeEditor: EditorStub,
  };
});

vi.mock('./utils.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  getConfig,
  readConfigFiles,
  getSessionConfigOverride,
  setSessionConfigOverride,
}));
vi.mock('@earendil-works/pi-coding-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@earendil-works/pi-coding-agent')>();
  return {
    ...actual,
    highlightCode: vi.fn((code: string) => code.trimEnd().split('\n')),
  };
});
vi.mock('@earendil-works/pi-tui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@earendil-works/pi-tui')>();
  return { ...actual, Editor: FakeEditor };
});

const { highlightCode } = await import('@earendil-works/pi-coding-agent');
const { showConfigWindow } = await import('./window.js');

type Component = {
  render: (width: number) => string[];
  invalidate: () => void;
  handleInput: (data: string) => void;
};

describe('config window', () => {
  const KEYS = {
    escape: '\x1b',
    tab: '\t',
    shiftTab: '\x1b[Z',
    up: '\x1b[A',
    down: '\x1b[B',
    pageUp: '\x1b[5~',
    pageDown: '\x1b[6~',
    home: '\x1b[H',
    end: '\x1b[F',
  };
  const WIDTH = 100;

  /** A config with `count` top-level keys, so it renders as `count` YAML lines. */
  const createLongConfig = (count: number): Record<string, number> =>
    Object.fromEntries(
      Array.from({ length: count }, (_, index) => [`key${index}`, index]),
    );

  /** Waits for the pending promises (the config loading) to settle. */
  const flush = (): Promise<void> =>
    new Promise((resolve) => {
      setImmediate(resolve);
    });

  const createTheme = () => ({
    fg: vi.fn((_color: string, text: string) => text),
  });

  /** Opens the window and returns the component, with the things the test may check. */
  const openWindow = async ({ rows = 24 }: { rows?: number } = {}) => {
    const theme = createTheme();
    const tui = { requestRender: vi.fn(), terminal: { rows } };
    const done = vi.fn();
    let factory: ((...args: unknown[]) => Component) | undefined;
    const custom = vi.fn((create: (...args: unknown[]) => Component) => {
      factory = create;
      return Promise.resolve();
    });
    const notify = vi.fn();

    await showConfigWindow({ hasUI: true, ui: { custom, notify } } as never);
    const component = factory!(tui, theme, {}, done);
    const editor = FakeEditor.instances.at(-1)!;

    return { component, editor, theme, tui, done, custom, notify };
  };

  const text = (component: Component, width = WIDTH): string =>
    component.render(width).join('\n');

  beforeEach(() => {
    vi.clearAllMocks();
    FakeEditor.instances.length = 0;
    state.override = undefined;
    readConfigFiles.mockResolvedValue({ config: { pi: { source: 'files' } } });
    getConfig.mockResolvedValue({ pi: { source: 'effective' } });
  });

  describe('opening', () => {
    it('tells the user when there is no interactive UI', async () => {
      const notify = vi.fn();
      const custom = vi.fn();

      await showConfigWindow({ hasUI: false, ui: { custom, notify } } as never);

      expect(notify).toHaveBeenCalledWith(
        '/config requires interactive mode UI',
        'warning',
      );
      expect(custom).not.toHaveBeenCalled();
    });

    it('opens a centered overlay', async () => {
      const { custom } = await openWindow();

      expect(custom).toHaveBeenCalledWith(expect.any(Function), {
        overlay: true,
        overlayOptions: { width: '90%', maxHeight: '85%', anchor: 'center' },
      });
    });
  });

  describe('effective config tab', () => {
    it('shows the loading state until the config is ready', async () => {
      const { component } = await openWindow();

      const loading = text(component);

      expect(loading).toContain('┌─ Config ');
      expect(loading).toContain('[Effective config]');
      expect(loading).toContain(' Override ');
      expect(loading).toContain('No session override set');
      expect(loading).toContain('Loading…');
      expect(loading).toContain('Tab switch tab • t toggle override • Esc close');
    });

    it('shows the config of the files, highlighted as YAML', async () => {
      const { component, tui } = await openWindow();

      await flush();

      expect(text(component)).toContain('source: files');
      expect(highlightCode).toHaveBeenCalledWith(
        stringifyYaml({ pi: { source: 'files' } }),
        'yaml',
      );
      expect(tui.requestRender).toHaveBeenCalled();
    });

    it('reports a config that failed to load', async () => {
      readConfigFiles.mockRejectedValue(new Error('files are broken'));
      const { component } = await openWindow();

      await flush();

      expect(text(component)).toContain('Failed to load config: files are broken');
    });

    it.each([
      ['hidden', 'Session override set — hidden (t to show)'],
      ['shown', 'Session override set — shown (t to hide)'],
    ])('says when the override is %s', async (mode, status) => {
      state.override = { pi: { source: 'override' } };
      const { component } = await openWindow();
      await flush();

      if (mode === 'shown') component.handleInput('t');

      expect(text(component)).toContain(status);
    });

    it('toggles between the files and the effective config with `t`, in any case', async () => {
      const { component } = await openWindow();
      await flush();

      component.handleInput('t');
      expect(text(component)).toContain('source: effective');
      expect(text(component)).not.toContain('source: files');

      component.handleInput('T');
      expect(text(component)).toContain('source: files');
    });

    it('reports an effective config that failed to load', async () => {
      getConfig.mockRejectedValue(new Error('effective is broken'));
      const { component } = await openWindow();
      await flush();

      component.handleInput('t');

      expect(text(component)).toContain('Failed to load config: effective is broken');
    });

    describe('scrolling', () => {
      beforeEach(() => {
        readConfigFiles.mockResolvedValue({ config: createLongConfig(29) });
      });

      it('does not show a scroll hint when the config fits', async () => {
        readConfigFiles.mockResolvedValue({ config: { pi: {} } });
        const { component } = await openWindow();
        await flush();

        expect(text(component)).not.toContain('PgUp/PgDn');
      });

      it('shows which lines are visible', async () => {
        const { component } = await openWindow({ rows: 24 });
        await flush();

        expect(text(component)).toContain(
          '(1-12/29) ↑↓/PgUp/PgDn scroll • Tab switch tab',
        );
      });

      it('scrolls line by line with the arrows, without going out of range', async () => {
        const { component } = await openWindow({ rows: 24 });
        await flush();

        component.handleInput(KEYS.up);
        expect(text(component)).toContain('(1-12/29)');

        component.handleInput(KEYS.down);
        expect(text(component)).toContain('(2-13/29)');

        component.handleInput(KEYS.up);
        expect(text(component)).toContain('(1-12/29)');
      });

      it('scrolls a page at a time', async () => {
        const { component } = await openWindow({ rows: 24 });
        await flush();

        component.handleInput(KEYS.pageDown);
        expect(text(component)).toContain('(13-24/29)');

        component.handleInput(KEYS.pageDown);
        expect(text(component)).toContain('(18-29/29)');

        component.handleInput(KEYS.pageUp);
        expect(text(component)).toContain('(6-17/29)');
      });

      it('jumps to the start and the end', async () => {
        const { component } = await openWindow({ rows: 24 });
        await flush();

        component.handleInput(KEYS.end);
        expect(text(component)).toContain('(18-29/29)');

        component.handleInput(KEYS.home);
        expect(text(component)).toContain('(1-12/29)');
      });

      it('uses at least a few lines in very short terminals', async () => {
        const { component } = await openWindow({ rows: 4 });
        await flush();

        expect(text(component)).toContain('(1-5/29)');
      });

      it('goes back to the top when toggling the override', async () => {
        getConfig.mockResolvedValue(createLongConfig(29));
        const { component } = await openWindow({ rows: 24 });
        await flush();
        component.handleInput(KEYS.end);

        component.handleInput('t');

        expect(text(component)).toContain('(1-12/');
      });

      it('ignores the keys it does not handle, without re-rendering', async () => {
        const { component, tui } = await openWindow({ rows: 24 });
        await flush();
        const renders = tui.requestRender.mock.calls.length;

        component.handleInput('x');

        expect(tui.requestRender).toHaveBeenCalledTimes(renders);
        expect(text(component)).toContain('(1-12/29)');
      });
    });
  });

  describe('tabs', () => {
    it('switches to the override tab and back, with Tab and Shift+Tab', async () => {
      const { component } = await openWindow();

      component.handleInput(KEYS.tab);
      expect(text(component)).toContain('Effective config');
      expect(text(component)).toContain('[Override]');
      expect(text(component)).toContain('Session override (YAML). Empty clears it.');
      expect(text(component)).toContain(
        'Enter apply/clear • Shift+Enter newline • Tab switch tab • Esc close',
      );

      component.handleInput(KEYS.shiftTab);
      expect(text(component)).toContain('[Effective config]');

      component.handleInput(KEYS.tab);
      component.handleInput(KEYS.tab);
      expect(text(component)).toContain('[Effective config]');
    });

    it('closes the window with Escape, from any tab', async () => {
      const { component, done } = await openWindow();

      component.handleInput(KEYS.escape);
      component.handleInput(KEYS.tab);
      component.handleInput(KEYS.escape);

      expect(done).toHaveBeenCalledTimes(2);
      expect(done).toHaveBeenCalledWith(undefined);
    });
  });

  describe('override tab', () => {
    it('starts with an empty editor when there is no override', async () => {
      const { editor } = await openWindow();

      expect(editor.text).toBe('');
    });

    it('starts with the current override in the editor', async () => {
      state.override = { pi: { source: 'override' } };

      const { editor } = await openWindow();

      expect(editor.text).toBe(stringifyYaml({ pi: { source: 'override' } }));
    });

    it('renders the editor', async () => {
      const { component } = await openWindow();

      component.handleInput(KEYS.tab);

      expect(text(component)).toContain('editor(96): ');
    });

    it('sends the input to the editor and renders again', async () => {
      const { component, editor, tui } = await openWindow();
      component.handleInput(KEYS.tab);
      const renders = tui.requestRender.mock.calls.length;

      component.handleInput('a');
      component.handleInput('\r');

      expect(editor.inputs).toEqual(['a', '\r']);
      expect(tui.requestRender.mock.calls.length).toBe(renders + 2);
    });

    it('does not send the input of the other tab to the editor', async () => {
      const { component, editor } = await openWindow();

      component.handleInput('a');

      expect(editor.inputs).toEqual([]);
    });

    describe('submitting', () => {
      const submit = async (value: string) => {
        const opened = await openWindow();
        await flush();
        getConfig.mockClear();
        opened.editor.onSubmit!(value);
        opened.component.handleInput(KEYS.tab);
        return opened;
      };

      it.each([
        ['empty content', ''],
        ['only whitespace', '   \n  '],
        ['a YAML `null`', 'null'],
        ['only a YAML comment', '# nothing here'],
      ])('clears the override with %s', async (_label, value) => {
        state.override = { pi: { source: 'old' } };

        const { component, editor, theme } = await submit(value);

        expect(setSessionConfigOverride).toHaveBeenCalledWith(undefined);
        expect(editor.text).toBe('');
        expect(text(component)).toContain('Session override cleared.');
        expect(theme.fg).toHaveBeenCalledWith('success', 'Session override cleared.');
      });

      it('applies a YAML mapping as the new override', async () => {
        const { component, editor, theme } = await submit('pi:\n  source: typed\n');

        expect(setSessionConfigOverride).toHaveBeenCalledWith({
          pi: { source: 'typed' },
        });
        expect(editor.text).toBe(stringifyYaml({ pi: { source: 'typed' } }));
        expect(text(component)).toContain('Session override applied.');
        expect(theme.fg).toHaveBeenCalledWith('success', 'Session override applied.');
      });

      it('reloads the effective config after applying', async () => {
        const { component } = await submit('pi:\n  source: typed\n');
        await flush();
        getConfig.mockResolvedValue({ pi: { source: 'reloaded' } });

        component.handleInput(KEYS.tab);
        component.handleInput('t');

        expect(getConfig).toHaveBeenCalled();
      });

      it('rejects invalid YAML, keeps the text and the previous override', async () => {
        const { component, editor, theme } = await submit('pi: [');

        expect(setSessionConfigOverride).not.toHaveBeenCalled();
        expect(editor.text).toBe('pi: [');
        expect(text(component)).toContain('Invalid YAML:');
        expect(theme.fg).toHaveBeenCalledWith(
          'warning',
          expect.stringContaining('Invalid YAML:'),
        );
      });

      it.each([
        ['a list', '- one\n- two'],
        ['a string', 'just text'],
        ['a number', '42'],
      ])(
        'rejects %s, because the override has to be a mapping',
        async (_label, value) => {
          const { component, editor } = await submit(value);

          expect(setSessionConfigOverride).not.toHaveBeenCalled();
          expect(editor.text).toBe(value);
          expect(text(component)).toContain('Override must be a YAML mapping (object).');
        },
      );
    });
  });

  describe('rendering', () => {
    it('adapts the editor theme to the Pi theme', async () => {
      const { editor, theme } = await openWindow();

      editor.theme.borderColor('border');
      editor.theme.selectList['selectedPrefix']!('prefix');
      editor.theme.selectList['selectedText']!('selected');
      editor.theme.selectList['description']!('description');
      editor.theme.selectList['scrollInfo']!('scroll');
      editor.theme.selectList['noMatch']!('none');

      expect(theme.fg.mock.calls).toEqual(
        expect.arrayContaining([
          ['accent', 'border'],
          ['accent', 'prefix'],
          ['accent', 'selected'],
          ['muted', 'description'],
          ['dim', 'scroll'],
          ['warning', 'none'],
        ]),
      );
    });

    it('draws the window within the width it is given', async () => {
      const { component } = await openWindow();
      await flush();

      const lines = component.render(40);

      expect(lines.length).toBeGreaterThan(4);
      expect(lines.at(0)).toMatch(/^┌─ Config ─+┐$/);
      expect(lines.at(-1)).toMatch(/^└─+┘$/);
      expect(lines.every((line) => visibleWidth(line) <= 40)).toBe(true);
    });

    it('keeps drawing in a window that is too narrow', async () => {
      const { component } = await openWindow();
      await flush();

      expect(() => component.render(3)).not.toThrow();
      expect(component.render(3).length).toBeGreaterThan(0);
    });

    it('colors the border and the tabs', async () => {
      const { component, theme } = await openWindow();

      component.render(WIDTH);

      expect(theme.fg).toHaveBeenCalledWith('borderAccent', expect.any(String));
      expect(theme.fg).toHaveBeenCalledWith('accent', '[Effective config]');
      expect(theme.fg).toHaveBeenCalledWith('muted', ' Override ');
    });

    it('reuses the lines while nothing changes', async () => {
      const { component } = await openWindow();
      await flush();

      const first = component.render(WIDTH);

      expect(component.render(WIDTH)).toBe(first);
    });

    it('renders again when the width changes', async () => {
      const { component } = await openWindow();
      await flush();

      const first = component.render(WIDTH);

      expect(component.render(WIDTH + 10)).not.toBe(first);
    });

    it('renders again after being invalidated', async () => {
      const { component } = await openWindow();
      await flush();
      const first = component.render(WIDTH);

      component.invalidate();

      expect(component.render(WIDTH)).not.toBe(first);
    });
  });
});
