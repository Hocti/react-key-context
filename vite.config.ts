import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		react(),
		dts({
			include: ["src"],
			insertTypesEntry: true,
		}),
	],
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/index.ts"),
			name: "ReactKeyContext",
			fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
		},
		rollupOptions: {
			external: ["react", "react-dom"],
			output: {
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
				},
			},
		},
	},
});
