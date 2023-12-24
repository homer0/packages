import React from 'react';
import type { Config } from './config';
import type { ConfigSlice, GenericConfig } from './types';

/**
 * The props for the component that renders the configuration as a script tag so they
 * can be accessed from the client side.
 */
type ConfigLoaderProps = {
  /**
   * The configuration to render. Created with the {@link createConfig} function.
   */
  config: Config<Record<string, ConfigSlice<string, GenericConfig>>>;
  /**
   * The children to render. Optional.
   */
  children?: React.ReactNode;
};
/**
 * Renders the configuration as a script tag so they can be accessed from the client side.
 *
 * @param props  The config to render and the, optional, children.
 */
export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ config, children }) => {
  const configValue = config.getConfig();
  return (
    <>
      {children}
      <script
        id={config.scriptId}
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(configValue) }}
      />
    </>
  );
};
