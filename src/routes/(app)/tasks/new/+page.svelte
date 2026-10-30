<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import TaskForm from '#lib/components/TaskForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const task = $derived(
		form?.values
			? {
					...form.values,
					projectId: Number(form.values.projectId) || undefined,
					assigneeId: Number(form.values.assigneeId) || null,
					estimateHours: Number(form.values.estimateHours),
					actualHours: Number(form.values.actualHours),
					progress: Number(form.values.progress)
				}
			: data.draft
	);
</script>

<svelte:head><title>เพิ่มงาน · Project Tracker</title></svelte:head>

<PageHeader title="เพิ่มงานใหม่" />

<Card.Root class="max-w-3xl">
	<Card.Content>
		<form method="POST" use:enhance class="space-y-5">
			<TaskForm {task} projects={data.projects} users={data.users} errors={form?.errors ?? {}} />
			{#if form?.errors?.code}<p class="text-sm text-destructive">{form.errors.code}</p>{/if}
			<div class="flex justify-end gap-2">
				<Button variant="ghost" href="/tasks">ยกเลิก</Button>
				<Button type="submit">บันทึกงาน</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
