<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const isAdmin = $derived(data.user?.role === 'admin');

	let createOpen = $state(false);
	let editing = $state<(typeof data.projects)[number] | null>(null);
</script>

<svelte:head><title>โปรเจกต์ · Project Tracker</title></svelte:head>

<PageHeader title="โปรเจกต์ / ลูกค้า" description="{data.projects.filter((p) => !p.archived).length} โปรเจกต์ที่ใช้งานอยู่">
	{#if isAdmin}
		<Dialog.Root bind:open={createOpen}>
			<Dialog.Trigger>
				{#snippet child({ props })}<Button {...props}>+ เพิ่มโปรเจกต์</Button>{/snippet}
			</Dialog.Trigger>
			<Dialog.Content>
				<form
					method="POST"
					action="?/create"
					class="space-y-4"
					use:enhance={() => async ({ result, update }) => {
						if (result.type === 'success') createOpen = false;
						await update();
					}}
				>
					<Dialog.Header><Dialog.Title>เพิ่มโปรเจกต์ใหม่</Dialog.Title></Dialog.Header>
					<div class="space-y-1.5">
						<Label for="c-name">ชื่อลูกค้า / โปรเจกต์</Label>
						<Input id="c-name" name="name" required />
					</div>
					<div class="space-y-1.5">
						<Label for="c-desc">รายละเอียด</Label>
						<Textarea id="c-desc" name="description" rows={3} />
					</div>
					{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
					<Dialog.Footer><Button type="submit">บันทึก</Button></Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</PageHeader>

<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
	{#each data.projects as p (p.id)}
		<Card.Root class={p.archived ? 'opacity-60' : ''}>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<a href="/projects/{p.id}" class="hover:underline">{p.name}</a>
					{#if p.archived}<Badge variant="outline">เก็บถาวร</Badge>{/if}
				</Card.Title>
				{#if p.description}<Card.Description>{p.description}</Card.Description>{/if}
				{#if isAdmin}
					<Card.Action>
						<Button variant="ghost" size="icon-sm" onclick={() => (editing = p)} aria-label="แก้ไข"><PencilIcon /></Button>
					</Card.Action>
				{/if}
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="flex items-center gap-2">
					<Progress value={p.stats.donePct} class="h-2" />
					<span class="w-10 text-right text-sm font-medium">{p.stats.donePct}%</span>
				</div>
				<div class="grid grid-cols-4 gap-2 text-center text-xs">
					<div><div class="text-lg font-semibold">{p.stats.total}</div><div class="text-muted-foreground">ทั้งหมด</div></div>
					<div><div class="text-lg font-semibold text-blue-600">{p.stats.doing + p.stats.review}</div><div class="text-muted-foreground">กำลังทำ</div></div>
					<div><div class="text-lg font-semibold text-emerald-600">{p.stats.done}</div><div class="text-muted-foreground">เสร็จ</div></div>
					<div><div class="text-lg font-semibold {p.stats.overdue ? 'text-red-600' : ''}">{p.stats.overdue}</div><div class="text-muted-foreground">เกินกำหนด</div></div>
				</div>
			</Card.Content>
			<Card.Footer class="gap-2">
				<Button href="/board?project={p.id}" variant="outline" size="sm">Kanban</Button>
				<Button href="/projects/{p.id}" variant="ghost" size="sm">รายละเอียด →</Button>
			</Card.Footer>
		</Card.Root>
	{/each}
</div>

{#if isAdmin}
	<Dialog.Root open={editing !== null} onOpenChange={(o) => !o && (editing = null)}>
		<Dialog.Content>
			{#if editing}
				<form
					method="POST"
					action="?/update"
					class="space-y-4"
					use:enhance={() => async ({ result, update }) => {
						if (result.type === 'success') editing = null;
						await update();
					}}
				>
					<input type="hidden" name="id" value={editing.id} />
					<Dialog.Header><Dialog.Title>แก้ไขโปรเจกต์</Dialog.Title></Dialog.Header>
					<div class="space-y-1.5">
						<Label for="e-name">ชื่อลูกค้า / โปรเจกต์</Label>
						<Input id="e-name" name="name" value={editing.name} required />
					</div>
					<div class="space-y-1.5">
						<Label for="e-desc">รายละเอียด</Label>
						<Textarea id="e-desc" name="description" rows={3} value={editing.description} />
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="archived" checked={editing.archived} class="size-4" />
						เก็บถาวร (ซ่อนจากตัวเลือกเมื่อสร้างงานใหม่)
					</label>
					{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
					<Dialog.Footer><Button type="submit">บันทึก</Button></Dialog.Footer>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{/if}
