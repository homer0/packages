import { isServer } from './utils';
import type { ConfigSlice, ConfigSettings, GenericConfig } from './types';

export class Config<
  Slices extends Record<string, ConfigSlice<string, GenericConfig>>,
  Settings = ConfigSettings<Slices>,
> {
  protected client: Settings | undefined;
  protected server: Settings | undefined;
  protected isServer: boolean = isServer();

  constructor(
    public readonly configName: string,
    public readonly scriptId: string,
    slices: Slices,
  ) {
    if (this.isServer) {
      this.server = this.setupServer(slices);
    }

    this.getConfig = this.getConfig.bind(this);
  }

  getConfig<SName extends keyof Settings>(name: SName): Settings[SName];
  getConfig(): Settings;
  getConfig<SName extends keyof Settings>(name?: SName): Settings[SName] | Settings {
    const config = this.getAll();

    if (name) {
      return config[name];
    }

    return config;
  }

  protected setConfig(context: 'client' | 'server', newConfig: Settings): Settings {
    this[context] = newConfig;
    return newConfig;
  }

  protected getAll(): Settings {
    if (this.isServer) {
      return this.server!;
    }

    if (!this.client) {
      return this.setConfig('client', this.setupClient());
    }

    return this.client;
  }

  protected setupServer(slices: Slices): Settings {
    return Object.entries(slices).reduce((acc, [name, sliceFn]) => {
      const key = name as keyof Settings;
      const value = sliceFn() as Settings[typeof key];
      acc[key] = value;

      return acc;
    }, {} as Settings);
  }

  protected setupClient(): Settings {
    const script = document.getElementById(this.scriptId);
    if (!script || !script.textContent) {
      throw new Error('The config was not loaded in the client');
    }

    let newConfig: Settings;
    try {
      newConfig = JSON.parse(script.textContent);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing the config loaded from the client');
      throw error;
    }

    return newConfig;
  }
}
