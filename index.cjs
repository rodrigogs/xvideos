const load = () => import("./dist/index.js").then((module) => module.default);

const callVideoMethod = (methodName) => {
	return (...arguments_) => {
		return load().then((xvideos) => xvideos.videos[methodName](...arguments_));
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

module.exports = xvideos;
module.exports.default = xvideos;
