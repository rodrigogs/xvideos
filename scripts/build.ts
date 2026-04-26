import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";

const run = async (command: string, args: string[]): Promise<void> => {
	await new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			shell: process.platform === "win32",
		});

		child.on("exit", (code) => {
			if (code === 0) {
				resolve(undefined);
				return;
			}

			reject(
				new Error(`${command} ${args.join(" ")} exited with code ${code}`),
			);
		});

		child.on("error", reject);
	});
};

await rm("dist", { force: true, recursive: true });
await run("tsc", ["-p", "tsconfig.json"]);
await run("tsc", ["-p", "tsconfig.cjs.json"]);
