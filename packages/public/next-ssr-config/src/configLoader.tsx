import React from 'react';
import type { Config } from './config';
import type { ConfigSlice, GenericConfig } from './types';

type ConfigLoaderProps = {
  config: Config<Record<string, ConfigSlice<string, GenericConfig>>>;
  children?: React.ReactNode;
};

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
