<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import TaskForm from '#lib/components/TaskForm.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import PriorityBadge from '#lib/components/PriorityBadge.svelte';
	import TimingBadge from '#lib/components/TimingBadge.svelte';
	import ActivityItem from '#lib/components/ActivityItem.svelte';
	import { fmtDate, fmtDateTime } from '#lib/dates.js';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let saved = $state(false);
	let confirmOpen = $state(false);
</script>

<svelte:head><title>{data.task.code} {data.task.title} · Project Tracker</title></svelte:head>

<PageHeader title="{data.task.code} · {data.task.title}" description={data.task.projectName}>
	<StatusBadge status={data.task.status} />
	<PriorityBadge priority={data.task.priority} />
	<TimingBadge task={data.task} today={data.today} />
	{#if data.canDelete}
		<Dialog.Root bind:open={confirmOpen}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="destructive" size="sm"><Trash2Icon /> ลบ</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>ลบงาน {data.task.code}?</Dialog.Title>
					<Dialog.Description>การลบจะถูกบันทึกใน Activity Log แต่ไม่สามารถกู้คืนรายละเอียดงานได้</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="ghost" onclick={() => (confirmOpen = false)}>ยกเลิก</Button>
					<form method="POST" action="?/delete" use:enhance>
						<Button type="submit" variant="destructive">ยืนยันลบ</Button>
					</form>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</PageHeader>

<div class="grid gap-5 xl:grid-cols-3">
	<Card.Root class="xl:col-span-2">
		<Card.Header>
			<Card.Title>รายละเอียดงาน</Card.Title>
			<Card.Description>
				{#if data.canEdit}
					{data.user?.role === 'admin' ? 'แก้ไขได้ทุกฟิลด์' : 'คุณแก้ไขได้เฉพาะสถานะ ความคืบหน้า ชั่วโมงจริง และหมายเหตุ'}
				{:else}
					ดูอย่างเดียว — งานนี้ไม่ได้อยู่ในความรับผิดชอบของคุณ
				{/if}
				· อัปเดตล่าสุด {fmtDateTime(data.task.updatedAt)}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/update"
				class="space-y-5"
				use:enhance={() => {
					return async ({ result, update }) => {
						saved = result.type === 'success';
						await update({ reset: false });
						if (saved) setTimeout(() => (saved = false), 2500);
					};
				}}
			>
				<fieldset disabled={!data.canEdit} class="contents">
					<TaskForm task={data.task} projects={data.projects} users={data.users} errors={form?.errors ?? {}} limited={data.user?.role !== 'admin'} />
				</fieldset>
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
				{#if data.canEdit}
					<div class="flex items-center justify-end gap-3">
						{#if saved}<span class="text-sm text-emerald-600">บันทึกแล้ว ✓</span>{/if}
						<Button variant="ghost" href="/board">กลับไป Board</Button>
						<Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
					</div>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="self-start">
		<Card.Header>
			<Card.Title>ประวัติการแก้ไข</Card.Title>
			<Card.Description>สร้างเมื่อ {fmtDate(data.task.createdAt?.slice(0, 10))}</Card.Description>
		</Card.Header>
		<Card.Content class="divide-y">
			{#each data.history as log (log.id)}
				<ActivityItem {log} showEntity={false} />
			{:else}
				<p class="py-4 text-sm text-muted-foreground">ยังไม่มีประวัติการแก้ไข (นำเข้าจาก Excel)</p>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
