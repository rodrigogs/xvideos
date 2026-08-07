const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

type XvideosApi = {
  videos: Record<string, (...arguments_: unknown[]) => unknown>;
  configure: (config: {
    minRequestIntervalMs?: number;
    proxyUrl?: string;
  }) => void;
};

const esmEntryUrl = pathToFileURL(join(__dirname, '../esm/index.js')).href;
let esmModulePromise: Promise<{ default: XvideosApi }> | undefined;

const load = (): Promise<XvideosApi> => {
  esmModulePromise ??= import(esmEntryUrl) as Promise<{
    default: XvideosApi;
  }>;

  return esmModulePromise.then((module) => module.default);
};

const callVideoMethod = (methodName: string) => {
  return (...arguments_: unknown[]) => {
    return load().then((xvideos) => {
      return xvideos.videos[methodName](...arguments_);
    });
  };
};

const xvideos = {
  videos: {
    best: callVideoMethod('best'),
    category: callVideoMethod('category'),
    dashboard: callVideoMethod('dashboard'),
    details: callVideoMethod('details'),
    fresh: callVideoMethod('fresh'),
    search: callVideoMethod('search'),
    verified: callVideoMethod('verified'),
  },

  configure: (config: unknown) => {
    return load().then((api) => {
      api.configure(
        config as { minRequestIntervalMs?: number; proxyUrl?: string },
      );
    });
  },
};

export = xvideos;
