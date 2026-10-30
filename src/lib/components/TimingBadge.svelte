<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { taskTiming } from '#lib/dates.js';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		task,
		today,
		class: className
	}: { task: { status: string; dueDate: string | null }; today?: string; class?: string } = $props();

	const t = $derived(taskTiming(task, today));
</script>

{#if t.status === 'overdue'}
	<span class={cn('inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400', className)}>
		<AlertTriangleIcon class="size-3.5" />{t.label}
	</span>
{:else if t.status === 'due_soon'}
	<span class={cn('inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400', className)}>
		<ClockIcon class="size-3.5" />{t.label}
	</span>
{:else if t.status === 'done'}
	<span class={cn('inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400', className)}>
		<CheckIcon class="size-3.5" />{t.label}
	</span>
{:else}
	<span class={cn('text-xs text-muted-foreground', className)}>{t.label}</span>
{/if}
