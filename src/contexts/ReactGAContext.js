// @flow

import React, {createContext, useContext} from 'react';
import type {StatelessFunctionalComponent} from 'react';

type ReactGAType = {
  event: (event: {category: string, action: string}) => void,
  pageview: (path: string) => void,
  initialize: (trackingId: string, options?: Object) => void,
};

const ReactGAContext: React$Context<?ReactGAType> =
  createContext<?ReactGAType>(null);

type ReactGAProviderProps = {
  children: React$Node,
  reactGA: ReactGAType,
};

export const ReactGAProvider: StatelessFunctionalComponent<
  ReactGAProviderProps,
> = ({children, reactGA}: ReactGAProviderProps) => (
  <ReactGAContext.Provider value={reactGA}>{children}</ReactGAContext.Provider>
);

export const useReactGA = (): ?ReactGAType => {
  return useContext(ReactGAContext);
};

export default ReactGAContext;
