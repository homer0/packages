import { isServer } from './utils.js';
import type { ConfigSlice, ConfigSettings, GenericConfig } from './types.js';
/**
 * This works as a service that handles the config both on the server and the client.
 * When initialized in the server, it will save the config in the instance and make sure it's
 * available to be read.
 * When initialized in the client, it will try to load and parse the config from the script tag
 * in the document, and then make it available to be read.
 *
 * Normally, you wouldn't use this class directly, but just create the instance with the
 * {@link createConfig} function.
 */
export class Config<
  Slices extends Record<string, ConfigSlice<string, GenericConfig>>,
  Settings = ConfigSettings<Slices>,
> {
  /**
   * The reference for the config once it's loaded in the client.
   */
  protected client: Settings | undefined;
  /**
   * The reference for the config once it's loaded in the server.
   */
  protected server: Settings | undefined;
  /**
   * A simple flag that will indicate if the instance is running on the server or not.
   */
  protected isServer: boolean = isServer();
  /**
   * @param configName  The name of the configuration.
   * @param scriptId    The ID of the script tag that the service will try to load the
   *                    config from.
   * @param slices      A dictionary of the slices used to build the config.
   */
  constructor(
    public readonly configName: string,
    public readonly scriptId: string,
    slices: Slices,
  ) {
    if (this.isServer) {
      this.server = this.setupServer(slices);
    }
    /**
     * @ignore
     */
    this.getConfig = this.getConfig.bind(this);
  }
  /**
   * Get the contents of the config, or a specific slice.
   *
   * @param name  The name of the slice. If not provided, it will return the whole
   *              config.
   */
  getConfig<SName extends keyof Settings>(name: SName): Settings[SName];
  getConfig(): Settings;
  getConfig<SName extends keyof Settings>(name?: SName): Settings[SName] | Settings {
    const config = this.getAll();

    if (name) {
      return config[name];
    }

    return config;
  }
  /**
   * Overwrites the config, for a specific context, with the provided one.
   *
   * @param context    Whether the config was loaded from the client or the server.
   * @param newConfig  The actual config to save.
   * @returns The saved config.
   */
  protected setConfig(context: 'client' | 'server', newConfig: Settings): Settings {
    this[context] = newConfig;
    return newConfig;
  }
  /**
   * Gets the config from the server or the client, depending on the context.
   * If the instance is on the client, and the config hasn't been loaded yet, it will try
   * to load it from the script tag in the document.
   *
   * @returns The config.
   */
  protected getAll(): Settings {
    if (this.isServer) {
      return this.server!;
    }

    if (!this.client) {
      return this.setConfig('client', this.setupClient());
    }

    return this.client;
  }
  /**
   * This gets called when the instance gets created in the server, and it takes care of
   * reading every slice and calling it to get and build the config.
   *
   * @param slices  The dictionary of slices that will be used to build the config.
   * @returns The built config, with the results of every slice.
   */
  protected setupServer(slices: Slices): Settings {
    return Object.entries(slices).reduce((acc, [name, sliceFn]) => {
      const key = name as keyof Settings;
      const value = sliceFn() as Settings[typeof key];
      acc[key] = value;

      return acc;
    }, {} as Settings);
  }
  /**
   * This get called when the instance gets created in the client, and the first time the
   * config is requested. It will try to load the config from the script tag in the
   * document,
   * and parse it.
   *
   * @returns The parsed config.
   * @throws If the script tag is not present or if it's empty.
   * @throws If the config can't be parsed.
   */
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
