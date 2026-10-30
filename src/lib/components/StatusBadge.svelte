<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { STATUS_LABELS } from '#lib/labels.js';
	import type { TaskStatus } from '#lib/constants.js';

	let { status, class: className }: { status: TaskStatus; class?: string } = $props();

	const styles: Record<TaskStatus, string> = {
		todo: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
		doing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900',
		review: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900',
		done: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900',
		hold: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900'
	};
</script>

<span
	class={cn(
		'inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium whitespace-nowrap',
		styles[status],
		className
	)}>{STATUS_LABELS[status]}</span
>
