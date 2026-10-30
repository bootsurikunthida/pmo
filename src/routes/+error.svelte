<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
	<div class="text-6xl font-bold text-muted-foreground/40">{page.status}</div>
	<p class="text-lg">{page.error?.message ?? 'เกิดข้อผิดพลาด'}</p>
	<Button href="/" variant="outline">กลับหน้าหลัก</Button>
</div>
