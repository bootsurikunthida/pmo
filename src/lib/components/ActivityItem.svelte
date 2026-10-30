<script lang="ts">
	import { ACTION_LABELS, ENTITY_LABELS, fieldLabel, formatValue } from '#lib/labels.js';
	import { fmtDateTime, timeAgo } from '#lib/dates.js';
	import type { ActivityLog } from '#lib/types.js';
	import { cn } from '#lib/utils.js';

	let { log, showEntity = true }: { log: ActivityLog; showEntity?: boolean } = $props();

	const changes = $derived.by(() => {
		try {
			return Object.entries(JSON.parse(log.changes) as Record<string, { from: unknown; to: unknown }>);
		} catch {
			return [];
		}
	});

	const color: Record<string, string> = {
		create: 'bg-emerald-500',
		update: 'bg-blue-500',
		status_change: 'bg-amber-500',
		delete: 'bg-red-500',
		login: 'bg-zinc-400',
		logout: 'bg-zinc-400',
		import: 'bg-purple-500'
	};

	const entityHref = $derived(
		log.entityType === 'task' && log.entityId && log.action !== 'delete'
			? `/tasks/${log.entityId}`
			: log.entityType === 'project' && log.entityId && log.action !== 'delete'
				? `/projects/${log.entityId}`
				: null
	);
</script>

<div class="flex gap-3 py-2.5">
	<div class="relative mt-1.5 flex shrink-0">
		<span class={cn('size-2 rounded-full', color[log.action] ?? 'bg-zinc-400')}></span>
	</div>
	<div class="min-w-0 flex-1 text-sm">
		<div class="flex flex-wrap items-baseline gap-x-1.5">
			<span class="font-medium">{log.actorName}</span>
			<span class="text-muted-foreground">{ACTION_LABELS[log.action]}</span>
			{#if showEntity && log.entityType !== 'system' && !['login', 'logout'].includes(log.action)}
				<span class="text-muted-foreground">{ENTITY_LABELS[log.entityType]}</span>
				{#if entityHref}
					<a href={entityHref} class="font-medium hover:underline">{log.entityLabel}</a>
				{:else}
					<span class="font-medium">{log.entityLabel}</span>
				{/if}
			{:else if log.action === 'import'}
				<span class="font-medium">{log.entityLabel}</span>
			{/if}
			<span class="ml-auto text-xs text-muted-foreground" title={fmtDateTime(log.createdAt)}>{timeAgo(log.createdAt)}</span>
		</div>
		{#if changes.length && !['login', 'logout'].includes(log.action)}
			<ul class="mt-1 space-y-0.5 text-xs text-muted-foreground">
				{#each changes as [field, c] (field)}
					<li class="flex flex-wrap items-center gap-1">
						<span class="font-medium text-foreground/80">{fieldLabel(field)}:</span>
						{#if log.action === 'create' || log.action === 'import'}
							<span>{formatValue(field, c.to)}</span>
						{:else if log.action === 'delete'}
							<span class="line-through">{formatValue(field, c.from)}</span>
						{:else}
							<span class="line-through decoration-red-400/70">{formatValue(field, c.from)}</span>
							<span>→</span>
							<span class="text-foreground">{formatValue(field, c.to)}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
