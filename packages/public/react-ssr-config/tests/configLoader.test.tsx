import { vi, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ConfigLoader } from '@src/configLoader.js';
import type { Config } from '@src/config.js';
import type { ConfigSlice, GenericConfig } from '@src/types.js';

describe('ConfigLoader', () => {
  const configValue = {
    names: ['Rosario', 'Pilar'],
    ages: [8, 4],
  };
  const configScriptId = 'configScriptId';
  const setupConfig = () => {
    const getConfig = vi.fn().mockReturnValueOnce(configValue);
    const config = {
      getConfig,
      scriptId: configScriptId,
    } as unknown as Config<Record<string, ConfigSlice<string, GenericConfig>>>;

    return config;
  };

  it('should render the script tag', () => {
    // Given/When
    const { container } = render(<ConfigLoader config={setupConfig()} />);
    const script = container.querySelector(`#${configScriptId}`);
    // Then
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/json');
    expect(script?.innerHTML).toBe(JSON.stringify(configValue));
  });

  it('should render the script tag and children', () => {
    // Given/When
    const { container } = render(
      <ConfigLoader config={setupConfig()}>
        <div>Child elements!</div>
      </ConfigLoader>,
    );
    const script = container.querySelector(`#${configScriptId}`);
    const children = container.querySelector('div');
    // Then
    expect(script?.innerHTML).toBe(JSON.stringify(configValue));
    expect(children?.innerHTML).toBe('Child elements!');
  });
});
