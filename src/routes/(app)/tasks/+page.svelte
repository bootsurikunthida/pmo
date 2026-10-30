<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import NativeSelect from '#lib/components/NativeSelect.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import PriorityBadge from '#lib/components/PriorityBadge.svelte';
	import TimingBadge from '#lib/components/TimingBadge.svelte';
	import { STATUS_LABELS, STATUS_ORDER } from '#lib/labels.js';
	import { fmtDate } from '#lib/dates.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function setFilter(key: string, value: string) {
		const u = new URL(page.url.href);
		if (value) u.searchParams.set(key, value);
		else u.searchParams.delete(key);
		goto(u.pathname + u.search, { reset: false });
	}
	let qTimer: ReturnType<typeof setTimeout>;
	function onSearch(e: Event) {
		const v = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(qTimer);
		qTimer = setTimeout(() => setFilter('q', v), 300);
	}
</script>

<svelte:head><title>งานทั้งหมด · Project Tracker</title></svelte:head>

<PageHeader title="งานทั้งหมด" description="{data.tasks.length} รายการ">
	<Button href="/tasks/new">+ เพิ่มงาน</Button>
</PageHeader>

<Card.Root>
	<Card.Header>
		<div class="flex flex-wrap gap-2">
			<Input class="w-56" placeholder="ค้นหา รหัส / ชื่องาน" value={data.filter.q} oninput={onSearch} />
			<NativeSelect class="w-44" value={data.filter.projectId ?? ''} onchange={(e) => setFilter('project', (e.currentTarget as HTMLSelectElement).value)}>
				<option value="">ทุกโปรเจกต์</option>
				{#each data.projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
			</NativeSelect>
			<NativeSelect class="w-40" value={data.filter.assigneeId ?? ''} onchange={(e) => setFilter('assignee', (e.currentTarget as HTMLSelectElement).value)}>
				<option value="">ทุกคน</option>
				{#each data.users as u (u.id)}<option value={u.id}>{u.name}</option>{/each}
			</NativeSelect>
			<NativeSelect class="w-36" value={data.filter.status ?? ''} onchange={(e) => setFilter('status', (e.currentTarget as HTMLSelectElement).value)}>
				<option value="">ทุกสถานะ</option>
				{#each STATUS_ORDER as s (s)}<option value={s}>{STATUS_LABELS[s]}</option>{/each}
			</NativeSelect>
			<Button variant={data.filter.late ? 'default' : 'outline'} onclick={() => setFilter('late', data.filter.late ? '' : '1')}>
				เฉพาะงานที่ช้า
			</Button>
			{#if data.filter.projectId || data.filter.assigneeId || data.filter.status || data.filter.late || data.filter.q}
				<Button variant="ghost" href="/tasks">ล้างตัวกรอง</Button>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="overflow-x-auto">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>รหัส</Table.Head>
					<Table.Head>งาน</Table.Head>
					<Table.Head>ผู้รับผิดชอบ</Table.Head>
					<Table.Head>ความสำคัญ</Table.Head>
					<Table.Head>สถานะ</Table.Head>
					<Table.Head>วันเริ่ม</Table.Head>
					<Table.Head>กำหนดเสร็จ</Table.Head>
					<Table.Head class="text-right">ชม. ประเมิน/จริง</Table.Head>
					<Table.Head class="text-right">%</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.tasks as t (t.id)}
					<Table.Row>
						<Table.Cell class="font-mono text-xs text-muted-foreground">{t.code}</Table.Cell>
						<Table.Cell>
							<a href="/tasks/{t.id}" class="font-medium hover:underline">{t.title}</a>
							<div class="text-xs text-muted-foreground">{t.projectName}</div>
						</Table.Cell>
						<Table.Cell>{t.assigneeName ?? '—'}</Table.Cell>
						<Table.Cell><PriorityBadge priority={t.priority} /></Table.Cell>
						<Table.Cell><StatusBadge status={t.status} /></Table.Cell>
						<Table.Cell class="text-muted-foreground">{fmtDate(t.startDate, false)}</Table.Cell>
						<Table.Cell><div>{fmtDate(t.dueDate, false)}</div><TimingBadge task={t} today={data.today} /></Table.Cell>
						<Table.Cell class="text-right text-muted-foreground">{t.estimateHours} / {t.actualHours}</Table.Cell>
						<Table.Cell class="text-right">{t.progress}%</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row><Table.Cell colspan={9} class="py-8 text-center text-muted-foreground">ไม่พบงานตามเงื่อนไข</Table.Cell></Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>
