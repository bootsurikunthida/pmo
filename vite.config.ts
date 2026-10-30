import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import { realpathSync } from 'node:fs';

// โฟลเดอร์โปรเจกต์อาจถูก Windows redirect (เช่น AppData\Roaming -> AppData\Local\Packages\...)
// จึงอนุญาตทั้ง path ที่เห็นและ path จริง ไม่เช่นนั้น Vite จะตอบ 403 ตอน serve ไฟล์ client
const cwd = process.cwd();
let realCwd = cwd;
try {
	realCwd = realpathSync.native(cwd);
} catch {
	/* ignore */
}

export default defineConfig({
	server: {
		fs: { allow: [searchForWorkspaceRoot(cwd), cwd, realCwd] }
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// สำหรับ deploy จริงบน Cloudflare Pages/Workers ให้เปลี่ยนเป็น
			//   import adapter from '@sveltejs/adapter-cloudflare';
			// (ติดตั้งไว้ใน devDependencies แล้ว) — adapter-auto ใช้สำหรับรันบนเครื่อง
			adapter: adapter()
		})
	]
});
