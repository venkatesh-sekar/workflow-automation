import React from 'react';

import { TelemetryEvent } from '@flow/shared';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  return (
    <TelemetryContext.Provider value={{ capture: () => {}, reset: () => {} }}>
      {children}
    </TelemetryContext.Provider>
  );
};

interface TelemetryContextType {
  capture: (event: TelemetryEvent) => void;
  reset: () => void;
}

const TelemetryContext = React.createContext<TelemetryContextType>({
  capture: () => {},
  reset: () => {},
});

export const useTelemetry = () => React.useContext(TelemetryContext);

export default TelemetryProvider;
