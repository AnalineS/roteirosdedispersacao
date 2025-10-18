import React from 'react';

// Context utilities
export function createContextProvider<T>(
  defaultValue: T,
  displayName?: string
): {
  Context: React.Context<T>;
  Provider: React.FC<{ value: T; children: React.ReactNode }>;
  useContext: () => T;
} {
  const Context = React.createContext<T>(defaultValue);
  if (displayName) {
    Context.displayName = displayName;
  }
  
  const Provider: React.FC<{ value: T; children: React.ReactNode }> = ({ value, children }) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  );
  
  const useContext = (): T => {
    const context = React.useContext(Context);
    if (context === defaultValue && displayName) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    }
    return context;
  };
  
  return { Context, Provider, useContext };
}

// Component prop utilities with JSX
export function withDefaultProps<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  defaultProps: Partial<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const mergedProps = { ...defaultProps, ...props };
    return <Component {...mergedProps} />;
  };
  
  WrappedComponent.displayName = `withDefaultProps(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}