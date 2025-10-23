import { lazy, ComponentType } from 'react';

/**
 * Utility for lazy loading components with retry logic
 * Helps with failed chunk loading errors
 */
export const lazyLoadWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): ReturnType<typeof lazy> => {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }
            
            console.warn(`Failed to load chunk, retrying... (${retriesLeft} attempts left)`);
            setTimeout(() => attemptImport(retriesLeft - 1), interval);
          });
      };
      
      attemptImport(retries);
    });
  });
};

/**
 * Preload a lazy component
 * Useful for prefetching on hover or route prediction
 */
export const preloadComponent = (importFunc: () => Promise<any>) => {
  importFunc();
};
