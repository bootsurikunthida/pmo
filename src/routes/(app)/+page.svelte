<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import PriorityBadge from '#lib/components/PriorityBadge.svelte';
	import TimingBadge from '#lib/components/TimingBadge.svelte';
	import ActivityItem from '#lib/components/ActivityItem.svelte';
	import { fmtDate } from '#lib/dates.js';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.summary);
	const k = $derived(s.kpi);
	const hoursRatio = $derived(k.actualHours ? Math.round((k.estimateHours / k.actualHours) * 100) : 0);

	type Tab = 'person' | 'project' | 'late';
	let tab = $state<Tab>('person');
	const tabs = $derived<{ id: Tab; label: string }[]>([
		{ id: 'person', label: 'สรุปรายคน' },
		{ id: 'project', label: 'สรุปรายโปรเจกต์' },
		{ id: 'late', label: `งานที่ช้า (${k.overdue + k.dueSoon})` }
	]);
</script>

<svelte:head><title>Dashboard · Project Tracker</title></svelte:head>

<PageHeader title="Dashboard" description="สรุปภาพรวมงาน ณ วันที่ {fmtDate(s.today)}">
	<Button href="/board" variant="outline">Kanban Board</Button>
	<Button href="/tasks/new">+ เพิ่มงาน</Button>
</PageHeader>

<!-- KPI -->
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
	<Card.Root class="gap-2 py-4">
		<Card.Header class="px-4"><Card.Description class="flex items-center gap-1.5"><ListChecksIcon class="size-3.5" />งานทั้งหมด</Card.Description></Card.Header>
		<Card.Content class="px-4 text-3xl font-semibold">{k.total}</Card.Content>
	</Card.Root>
	<Card.Root class="gap-2 py-4">
		<Card.Header class="px-4"><Card.Description class="flex items-center gap-1.5"><CheckCircleIcon class="size-3.5" />เสร็จแล้ว</Card.Description></Card.Header>
		<Card.Content class="px-4">
			<div class="text-3xl font-semibold">{k.done} <span class="text-base font-normal text-muted-foreground">({k.donePct}%)</span></div>
			<Progress value={k.donePct} class="mt-2 h-1.5" />
		</Card.Content>
	</Card.Root>
	<Card.Root class="gap-2 py-4 {k.overdue ? 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30' : ''}">
		<Card.Header class="px-4"><Card.Description class="flex items-center gap-1.5"><AlertTriangleIcon class="size-3.5 text-red-500" />เกินกำหนด</Card.Description></Card.Header>
		<Card.Content class="px-4 text-3xl font-semibold text-red-600 dark:text-red-400">{k.overdue}</Card.Content>
	</Card.Root>
	<Card.Root class="gap-2 py-4">
		<Card.Header class="px-4"><Card.Description class="flex items-center gap-1.5"><ClockIcon class="size-3.5 text-amber-500" />ใกล้ครบกำหนด (≤3 วัน)</Card.Description></Card.Header>
		<Card.Content class="px-4 text-3xl font-semibold text-amber-600 dark:text-amber-400">{k.dueSoon}</Card.Content>
	</Card.Root>
	<Card.Root class="gap-2 py-4">
		<Card.Header class="px-4"><Card.Description class="flex items-center gap-1.5"><TimerIcon class="size-3.5" />ชั่วโมง ประเมิน / จริง</Card.Description></Card.Header>
		<Card.Content class="px-4">
			<div class="text-3xl font-semibold">{k.estimateHours} <span class="text-base font-normal text-muted-foreground">/ {k.actualHours} ชม.</span></div>
			<div class="mt-1 text-xs text-muted-foreground">ประเมิน ÷ จริง = {hoursRatio}%</div>
		</Card.Content>
	</Card.Root>
</div>

{#if data.myTasks.length}
	<Card.Root class="mt-5">
		<Card.Header>
			<Card.Title>งานของฉันที่ยังไม่เสร็จ ({data.myTasks.length})</Card.Title>
			<Card.Action><Button href="/board?mine=1" variant="ghost" size="sm">เปิดใน Kanban →</Button></Card.Action>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>รหัส</Table.Head>
						<Table.Head>งาน</Table.Head>
						<Table.Head>โปรเจกต์</Table.Head>
						<Table.Head>สถานะ</Table.Head>
						<Table.Head>กำหนดเสร็จ</Table.Head>
						<Table.Head class="text-right">%</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.myTasks as t (t.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs text-muted-foreground">{t.code}</Table.Cell>
							<Table.Cell><a href="/tasks/{t.id}" class="font-medium hover:underline">{t.title}</a></Table.Cell>
							<Table.Cell class="text-muted-foreground">{t.projectName}</Table.Cell>
							<Table.Cell><StatusBadge status={t.status} /></Table.Cell>
							<Table.Cell><div>{fmtDate(t.dueDate, false)}</div><TimingBadge task={t} today={s.today} /></Table.Cell>
							<Table.Cell class="text-right">{t.progress}%</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
{/if}

<div class="mt-5 grid gap-5 xl:grid-cols-3">
	<div class="xl:col-span-2">
		<div class="space-y-2">
			<div class="inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-1 text-muted-foreground" role="tablist">
				{#each tabs as t (t.id)}
					<button
						type="button"
						role="tab"
						aria-selected={tab === t.id}
						onclick={() => (tab = t.id)}
						class={cn(
							'rounded-md px-3 py-1 text-sm font-medium transition-colors',
							tab === t.id ? 'bg-background text-foreground shadow-xs' : 'hover:text-foreground'
						)}>{t.label}</button
					>
				{/each}
			</div>

			{#if tab === 'person'}
				<Card.Root>
					<Card.Content class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>ผู้รับผิดชอบ</Table.Head>
									<Table.Head class="text-right">ทั้งหมด</Table.Head>
									<Table.Head class="text-right">To do</Table.Head>
									<Table.Head class="text-right">Doing</Table.Head>
									<Table.Head class="text-right">รอตรวจ</Table.Head>
									<Table.Head class="text-right">Done</Table.Head>
									<Table.Head class="text-right text-red-600">เกินกำหนด</Table.Head>
									<Table.Head class="text-right">ชม. ประเมิน/จริง</Table.Head>
									<Table.Head class="w-32">% เสร็จ</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each s.byPerson as p (p.userId)}
									<Table.Row>
										<Table.Cell>
											<a href="/board?assignee={p.userId}" class="font-medium hover:underline">{p.name}</a>
											<div class="text-xs text-muted-foreground">{p.position}</div>
										</Table.Cell>
										<Table.Cell class="text-right">{p.total}</Table.Cell>
										<Table.Cell class="text-right">{p.todo}</Table.Cell>
										<Table.Cell class="text-right">{p.doing}</Table.Cell>
										<Table.Cell class="text-right">{p.review}</Table.Cell>
										<Table.Cell class="text-right">{p.done}</Table.Cell>
										<Table.Cell class="text-right font-medium {p.overdue ? 'text-red-600' : 'text-muted-foreground'}">{p.overdue}</Table.Cell>
										<Table.Cell class="text-right text-muted-foreground">{p.estimateHours} / {p.actualHours}</Table.Cell>
										<Table.Cell>
											<div class="flex items-center gap-2">
												<Progress value={p.donePct} class="h-1.5" />
												<span class="w-9 text-right text-xs">{p.donePct}%</span>
											</div>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
							<Table.Footer>
								<Table.Row>
									<Table.Cell class="font-medium">รวมทั้งทีม</Table.Cell>
									<Table.Cell class="text-right">{k.total}</Table.Cell>
									<Table.Cell class="text-right">{s.byPerson.reduce((a, p) => a + p.todo, 0)}</Table.Cell>
									<Table.Cell class="text-right">{s.byPerson.reduce((a, p) => a + p.doing, 0)}</Table.Cell>
									<Table.Cell class="text-right">{s.byPerson.reduce((a, p) => a + p.review, 0)}</Table.Cell>
									<Table.Cell class="text-right">{k.done}</Table.Cell>
									<Table.Cell class="text-right text-red-600">{k.overdue}</Table.Cell>
									<Table.Cell class="text-right">{k.estimateHours} / {k.actualHours}</Table.Cell>
									<Table.Cell class="text-xs">{k.donePct}%</Table.Cell>
								</Table.Row>
							</Table.Footer>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			{:else if tab === 'project'}
				<Card.Root>
					<Card.Content class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>โปรเจกต์</Table.Head>
									<Table.Head class="text-right">ทั้งหมด</Table.Head>
									<Table.Head class="text-right">To do</Table.Head>
									<Table.Head class="text-right">Doing</Table.Head>
									<Table.Head class="text-right">รอตรวจ</Table.Head>
									<Table.Head class="text-right">Done</Table.Head>
									<Table.Head class="text-right text-red-600">เกินกำหนด</Table.Head>
									<Table.Head class="text-right">ชม. ประเมิน/จริง</Table.Head>
									<Table.Head class="w-32">ความคืบหน้าเฉลี่ย</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each s.byProject as p (p.projectId)}
									<Table.Row>
										<Table.Cell><a href="/projects/{p.projectId}" class="font-medium hover:underline">{p.name}</a></Table.Cell>
										<Table.Cell class="text-right">{p.total}</Table.Cell>
										<Table.Cell class="text-right">{p.todo}</Table.Cell>
										<Table.Cell class="text-right">{p.doing}</Table.Cell>
										<Table.Cell class="text-right">{p.review}</Table.Cell>
										<Table.Cell class="text-right">{p.done}</Table.Cell>
										<Table.Cell class="text-right font-medium {p.overdue ? 'text-red-600' : 'text-muted-foreground'}">{p.overdue}</Table.Cell>
										<Table.Cell class="text-right text-muted-foreground">{p.estimateHours} / {p.actualHours}</Table.Cell>
										<Table.Cell>
											<div class="flex items-center gap-2">
												<Progress value={p.avgProgress} class="h-1.5" />
												<span class="w-9 text-right text-xs">{p.avgProgress}%</span>
											</div>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Content class="overflow-x-auto">
						{#if s.overdueTasks.length + s.dueSoonTasks.length === 0}
							<p class="py-6 text-center text-sm text-muted-foreground">ไม่มีงานที่เกินกำหนดหรือใกล้ครบกำหนด 🎉</p>
						{:else}
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
									{#each [...s.overdueTasks, ...s.dueSoonTasks] as t (t.id)}
										<Table.Row>
											<Table.Cell class="font-mono text-xs text-muted-foreground">{t.code}</Table.Cell>
											<Table.Cell>
												<a href="/tasks/{t.id}" class="font-medium hover:underline">{t.title}</a>
												<div class="text-xs text-muted-foreground">{t.projectName}</div>
											</Table.Cell>
											<Table.Cell>{t.assigneeName ?? '—'}</Table.Cell>
											<Table.Cell><PriorityBadge priority={t.priority} /></Table.Cell>
											<Table.Cell><StatusBadge status={t.status} /></Table.Cell>
											<Table.Cell><div>{fmtDate(t.dueDate, false)}</div><TimingBadge task={t} today={s.today} /></Table.Cell>
											<Table.Cell class="text-right">{t.progress}%</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>

	<Card.Root class="self-start">
		<Card.Header>
			<Card.Title>ความเคลื่อนไหวล่าสุด</Card.Title>
			<Card.Action><Button href="/activity" variant="ghost" size="sm">ดูทั้งหมด →</Button></Card.Action>
		</Card.Header>
		<Card.Content class="divide-y">
			{#each data.recent as log (log.id)}
				<ActivityItem {log} />
			{:else}
				<p class="py-4 text-sm text-muted-foreground">ยังไม่มีความเคลื่อนไหว</p>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
