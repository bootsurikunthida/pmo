<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { PRIORITY_LABELS } from '#lib/labels.js';
	import type { Priority } from '#lib/constants.js';

	let { priority, class: className }: { priority: Priority; class?: string } = $props();

	const styles: Record<Priority, string> = {
		high: 'text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-950 dark:border-red-900',
		medium: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-200 dark:bg-orange-950 dark:border-orange-900',
		low: 'text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
	};
	const dot: Record<Priority, string> = { high: 'bg-red-500', medium: 'bg-orange-400', low: 'bg-zinc-400' };
</script>

<span
	class={cn(
		'inline-flex h-5 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap',
		styles[priority],
		className
	)}
>
	<span class={cn('size-1.5 rounded-full', dot[priority])}></span>
	{PRIORITY_LABELS[priority]}
</span>
