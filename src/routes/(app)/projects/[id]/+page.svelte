<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import PriorityBadge from '#lib/components/PriorityBadge.svelte';
	import TimingBadge from '#lib/components/TimingBadge.svelte';
	import ActivityItem from '#lib/components/ActivityItem.svelte';
	import { fmtDate } from '#lib/dates.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const p = $derived(data.summary.byProject[0]);
</script>

<svelte:head><title>{data.project.name} · Project Tracker</title></svelte:head>

<PageHeader title={data.project.name} description={data.project.description || 'โปรเจกต์ / ลูกค้า'}>
	<Button href="/board?project={data.project.id}" variant="outline">Kanban</Button>
	<Button href="/tasks/new?project={data.project.id}">+ เพิ่มงาน</Button>
</PageHeader>

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
	<Card.Root class="gap-2 py-4"><Card.Header class="px-4"><Card.Description>งานทั้งหมด</Card.Description></Card.Header><Card.Content class="px-4 text-3xl font-semibold">{p.total}</Card.Content></Card.Root>
	<Card.Root class="gap-2 py-4"><Card.Header class="px-4"><Card.Description>เสร็จแล้ว</Card.Description></Card.Header><Card.Content class="px-4"><div class="text-3xl font-semibold">{p.done} <span class="text-base font-normal text-muted-foreground">({p.donePct}%)</span></div><Progress value={p.donePct} class="mt-2 h-1.5" /></Card.Content></Card.Root>
	<Card.Root class="gap-2 py-4"><Card.Header class="px-4"><Card.Description>เกินกำหนด</Card.Description></Card.Header><Card.Content class="px-4 text-3xl font-semibold {p.overdue ? 'text-red-600' : ''}">{p.overdue}</Card.Content></Card.Root>
	<Card.Root class="gap-2 py-4"><Card.Header class="px-4"><Card.Description>ชั่วโมง ประเมิน / จริง</Card.Description></Card.Header><Card.Content class="px-4 text-3xl font-semibold">{p.estimateHours} <span class="text-base font-normal text-muted-foreground">/ {p.actualHours}</span></Card.Content></Card.Root>
</div>

<div class="mt-5 grid gap-5 xl:grid-cols-3">
	<Card.Root class="xl:col-span-2">
		<Card.Header><Card.Title>งานในโปรเจกต์</Card.Title></Card.Header>
		<Card.Content class="overflow-x-auto">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>รหัส</Table.Head>
						<Table.Head>งาน</Table.Head>
						<Table.Head>ผู้รับผิดชอบ</Table.Head>
						<Table.Head>ความสำคัญ</Table.Head>
						<Table.Head>สถานะ</Table.Head>
						<Table.Head>กำหนดเสร็จ</Table.Head>
						<Table.Head class="text-right">%</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.tasks as t (t.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs text-muted-foreground">{t.code}</Table.Cell>
							<Table.Cell><a href="/tasks/{t.id}" class="font-medium hover:underline">{t.title}</a></Table.Cell>
							<Table.Cell>{t.assigneeName ?? '—'}</Table.Cell>
							<Table.Cell><PriorityBadge priority={t.priority} /></Table.Cell>
							<Table.Cell><StatusBadge status={t.status} /></Table.Cell>
							<Table.Cell><div>{fmtDate(t.dueDate, false)}</div><TimingBadge task={t} today={data.summary.today} /></Table.Cell>
							<Table.Cell class="text-right">{t.progress}%</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row><Table.Cell colspan={7} class="py-8 text-center text-muted-foreground">ยังไม่มีงาน</Table.Cell></Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<div class="space-y-5">
		<Card.Root>
			<Card.Header><Card.Title>ทีมที่รับผิดชอบ</Card.Title></Card.Header>
			<Card.Content class="space-y-3">
				{#each data.summary.byPerson as u (u.userId)}
					<div>
						<div class="flex items-center justify-between text-sm">
							<span class="font-medium">{u.name}</span>
							<span class="text-muted-foreground">{u.done}/{u.total} เสร็จ{#if u.overdue} · <span class="text-red-600">ช้า {u.overdue}</span>{/if}</span>
						</div>
						<Progress value={u.donePct} class="mt-1 h-1.5" />
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">ยังไม่มีผู้รับผิดชอบ</p>
				{/each}
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header><Card.Title>ประวัติโปรเจกต์</Card.Title></Card.Header>
			<Card.Content class="divide-y">
				{#each data.history as log (log.id)}
					<ActivityItem {log} showEntity={false} />
				{:else}
					<p class="py-2 text-sm text-muted-foreground">ยังไม่มีการแก้ไข</p>
				{/each}
			</Card.Content>
		</Card.Root>
	</div>
</div>
