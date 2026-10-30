<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import NativeSelect from '#lib/components/NativeSelect.svelte';
	import PriorityBadge from '#lib/components/PriorityBadge.svelte';
	import TimingBadge from '#lib/components/TimingBadge.svelte';
	import { STATUS_LABELS, STATUS_ORDER } from '#lib/labels.js';
	import { fmtDate } from '#lib/dates.js';
	import { cn } from '#lib/utils.js';
	import type { TaskStatus } from '#lib/constants.js';
	import type { TaskRow } from '#lib/types.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isAdmin = $derived(data.user?.role === 'admin');
	const canEdit = (t: TaskRow) => isAdmin || t.assigneeId === data.user?.id;

	const columns = $derived(
		STATUS_ORDER.map((s) => ({ status: s, tasks: data.tasks.filter((t) => t.status === s) }))
	);

	const colStyle: Record<TaskStatus, string> = {
		todo: 'border-t-zinc-400',
		doing: 'border-t-blue-500',
		review: 'border-t-amber-500',
		done: 'border-t-emerald-500',
		hold: 'border-t-purple-500'
	};

	let error = $state('');
	let dragging = $state<number | null>(null);
	let overCol = $state<TaskStatus | null>(null);
	let pending = $state<Record<number, TaskStatus>>({});

	// ส่งคำสั่งย้ายผ่าน hidden form + use:enhance (ให้ SvelteKit จัดการ serialize/invalidate ให้)
	let moveForm = $state<HTMLFormElement | null>(null);
	let moveId = $state(0);
	let moveStatus = $state<TaskStatus>('todo');
	// คง query string (filter) ไว้ใน action URL ไม่ให้หายหลังย้ายการ์ด
	const moveAction = $derived(
		'?' + (page.url.search ? page.url.search.slice(1) + '&' : '') + '/move'
	);

	async function move(id: number, status: TaskStatus) {
		const t = data.tasks.find((x) => x.id === id);
		if (!t || t.status === status) return;
		if (!canEdit(t)) {
			error = 'คุณย้ายได้เฉพาะงานที่ตัวเองรับผิดชอบ';
			return;
		}
		error = '';
		pending = { ...pending, [id]: status };
		moveId = id;
		moveStatus = status;
		await tick();
		moveForm?.requestSubmit();
	}

	function shift(t: TaskRow, dir: -1 | 1) {
		const i = STATUS_ORDER.indexOf(t.status);
		const next = STATUS_ORDER[i + dir];
		if (next) move(t.id, next);
	}

	function onDragStart(e: DragEvent, t: TaskRow) {
		if (!canEdit(t)) {
			e.preventDefault();
			return;
		}
		dragging = t.id;
		e.dataTransfer?.setData('text/plain', String(t.id));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}
	function onDrop(e: DragEvent, status: TaskStatus) {
		e.preventDefault();
		const id = Number(e.dataTransfer?.getData('text/plain') || dragging);
		dragging = null;
		overCol = null;
		if (id) move(id, status);
	}

	function setFilter(key: string, value: string) {
		const u = new URL(page.url.href);
		if (value) u.searchParams.set(key, value);
		else u.searchParams.delete(key);
		if (key !== 'mine') u.searchParams.delete('mine');
		goto(u.pathname + u.search, { reset: false });
	}

	/** สถานะที่แสดงบนการ์ดระหว่างรอ server (optimistic) */
	const displayTasks = $derived(
		data.tasks.map((t) => (pending[t.id] ? { ...t, status: pending[t.id] } : t))
	);
	const displayColumns = $derived(
		STATUS_ORDER.map((s) => ({ status: s, tasks: displayTasks.filter((t) => t.status === s) }))
	);
</script>

<svelte:head><title>Kanban Board · Project Tracker</title></svelte:head>

<PageHeader title="Kanban Board" description="ลากการ์ดเพื่อเปลี่ยนสถานะ หรือใช้ปุ่ม ‹ › บนการ์ด">
	<NativeSelect
		class="w-48"
		value={data.filter.projectId ?? ''}
		onchange={(e) => setFilter('project', (e.currentTarget as HTMLSelectElement).value)}
	>
		<option value="">ทุกโปรเจกต์</option>
		{#each data.projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
	</NativeSelect>
	<NativeSelect
		class="w-40"
		value={data.filter.mine ? '' : (data.filter.assigneeId ?? '')}
		onchange={(e) => setFilter('assignee', (e.currentTarget as HTMLSelectElement).value)}
	>
		<option value="">ทุกคน</option>
		{#each data.users as u (u.id)}<option value={u.id}>{u.name}</option>{/each}
	</NativeSelect>
	<Button variant={data.filter.mine ? 'default' : 'outline'} onclick={() => setFilter('mine', data.filter.mine ? '' : '1')}>
		งานของฉัน
	</Button>
	<Button href="/tasks/new">+ เพิ่มงาน</Button>
</PageHeader>

{#if error}
	<div class="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
{/if}

<form
	bind:this={moveForm}
	method="POST"
	action={moveAction}
	class="hidden"
	use:enhance={({ formData }) => {
		const id = Number(formData.get('id'));
		return async ({ result, update }) => {
			if (result.type === 'failure') error = String(result.data?.message ?? 'เกิดข้อผิดพลาด');
			await update({ reset: false });
			const { [id]: _, ...rest } = pending;
			pending = rest;
		};
	}}
>
	<input type="hidden" name="id" value={moveId} />
	<input type="hidden" name="status" value={moveStatus} />
</form>

<div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
	{#each displayColumns as col (col.status)}
		<section
			class={cn(
				'flex min-h-64 flex-col rounded-lg border border-t-4 bg-muted/40 transition-colors',
				colStyle[col.status],
				overCol === col.status && dragging !== null && 'bg-primary/5 ring-2 ring-primary/30'
			)}
			role="list"
			ondragover={(e) => {
				e.preventDefault();
				overCol = col.status;
			}}
			ondragleave={() => (overCol = null)}
			ondrop={(e) => onDrop(e, col.status)}
		>
			<header class="flex items-center justify-between px-3 py-2">
				<h2 class="text-sm font-semibold">{STATUS_LABELS[col.status]}</h2>
				<Badge variant="secondary">{col.tasks.length}</Badge>
			</header>
			<div class="flex flex-1 flex-col gap-2 px-2 pb-2">
				{#each col.tasks as t (t.id)}
					{@const editable = canEdit(t)}
					<article
						role="listitem"
						draggable={editable}
						ondragstart={(e) => onDragStart(e, t)}
						ondragend={() => {
							dragging = null;
							overCol = null;
						}}
						class={cn(
							'group rounded-md border bg-card p-2.5 text-card-foreground shadow-xs transition-opacity',
							editable ? 'cursor-grab active:cursor-grabbing' : 'opacity-80',
							dragging === t.id && 'opacity-40',
							pending[t.id] && 'animate-pulse'
						)}
					>
						<div class="flex items-start gap-1">
							{#if editable}<GripVerticalIcon class="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />{/if}
							<div class="min-w-0 flex-1">
								<div class="text-[11px] text-muted-foreground">{t.code} · {t.projectName}</div>
								<a href="/tasks/{t.id}" class="line-clamp-2 text-sm font-medium leading-snug hover:underline">{t.title}</a>
							</div>
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-1.5">
							<PriorityBadge priority={t.priority} />
							<span class="text-xs text-muted-foreground">{t.assigneeName ?? '—'}</span>
						</div>
						<div class="mt-1.5 flex items-center justify-between gap-2">
							<div class="text-xs text-muted-foreground">
								{#if t.dueDate}ส่ง {fmtDate(t.dueDate, false)}{/if}
							</div>
							<TimingBadge task={t} today={data.today} />
						</div>
						{#if t.progress > 0 && t.status !== 'done'}
							<div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
								<div class="h-full bg-primary" style="width:{t.progress}%"></div>
							</div>
						{/if}
						{#if editable}
							<div class="mt-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
								<Button variant="ghost" size="icon-xs" disabled={STATUS_ORDER.indexOf(t.status) === 0} onclick={() => shift(t, -1)} aria-label="ย้ายไปสถานะก่อนหน้า"><ChevronLeftIcon /></Button>
								<Button variant="ghost" size="icon-xs" disabled={STATUS_ORDER.indexOf(t.status) === STATUS_ORDER.length - 1} onclick={() => shift(t, 1)} aria-label="ย้ายไปสถานะถัดไป"><ChevronRightIcon /></Button>
							</div>
						{/if}
					</article>
				{:else}
					<div class="flex flex-1 items-center justify-center rounded-md border border-dashed py-6 text-xs text-muted-foreground">ไม่มีงาน</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
