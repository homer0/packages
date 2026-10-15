import type {
  ConfigPath,
  ConfigPathValue,
  ExtensionsConfig,
  PiConfig,
  PiCoreConfig,
  SkillsConfig,
  ToolsConfig,
} from '@homer0/pi-config';
import { describe, expect, expectTypeOf, it } from 'vitest';

declare module '@homer0/pi-config' {
  interface SkillsConfig {
    augmentedSkill?: boolean;
  }

  interface ToolsConfig {
    augmentedTool?: boolean;
  }

  interface ExtensionsConfig {
    augmentedExtension?: boolean;
  }
}

describe('config types augmentation', () => {
  it('lets consumers extend the namespaces with module augmentation', () => {
    const paths: ConfigPath[] = [
      'skills.augmentedSkill',
      'tools.augmentedTool',
      'extensions.augmentedExtension',
    ];

    expect(paths).toHaveLength(3);
  });

  it('rejects the paths that nothing declares', () => {
    // @ts-expect-error -- Nothing declares this path.
    const path: ConfigPath = 'skills.undeclared';

    expect(path).toBe('skills.undeclared');
  });

  it('resolves the type of the values that were declared', () => {
    expectTypeOf<ConfigPathValue<'skills.augmentedSkill'>>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<ConfigPathValue<'extensions.augmentedExtension'>>().toEqualTypeOf<
      boolean | undefined
    >();
  });

  it('builds the resolved config from the four exported interfaces', () => {
    expectTypeOf<PiCoreConfig['pi']>().toEqualTypeOf<PiConfig>();
    expectTypeOf<PiCoreConfig['skills']>().toEqualTypeOf<SkillsConfig>();
    expectTypeOf<PiCoreConfig['tools']>().toEqualTypeOf<ToolsConfig>();
    expectTypeOf<PiCoreConfig['extensions']>().toEqualTypeOf<ExtensionsConfig>();

    expect(true).toBe(true);
  });
});
