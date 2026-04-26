const { join } = require("node:path");
const { pathToFileURL } = require("node:url");

const esmEntryUrl = pathToFileURL(join(__dirname, "../esm/index.js")).href;
const load = () => import(esmEntryUrl).then((module) => module.default);

const callVideoMethod = (methodName: string) => {
	return (...arguments_: unknown[]) => {
		return load().then((xvideos) => {
			return (
				xvideos.videos as Record<string, (...arguments_: unknown[]) => unknown>
			)[methodName](...arguments_);
		});
	};
};

const xvideos = {
	videos: {
		best: callVideoMethod("best"),
		dashboard: callVideoMethod("dashboard"),
		details: callVideoMethod("details"),
		fresh: callVideoMethod("fresh"),
		search: callVideoMethod("search"),
		verified: callVideoMethod("verified"),
	},
};

export = xvideos;
