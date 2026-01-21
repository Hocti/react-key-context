import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			// Alias to source for easier development/debugging
			"react-key-context": path.resolve(__dirname, "../src/index.ts"),
		},
	},
});
