<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import NativeSelect from '#lib/components/NativeSelect.svelte';
	import { ROLE_LABELS } from '#lib/labels.js';
	import { fmtDate } from '#lib/dates.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	type Emp = (typeof data.employees)[number];

	let createOpen = $state(false);
	let editing = $state<Emp | null>(null);
	let deleting = $state<Emp | null>(null);

	const errors = $derived((form?.errors ?? {}) as Record<string, string>);
</script>

<svelte:head><title>พนักงาน · Project Tracker</title></svelte:head>

{#snippet userFields(u: Emp | null)}
	<div class="grid gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label>ชื่อ <span class="text-destructive">*</span></Label>
			<Input name="name" value={u?.name ?? ''} required />
			{#if errors.name}<p class="text-xs text-destructive">{errors.name}</p>{/if}
		</div>
		<div class="space-y-1.5">
			<Label>Username <span class="text-destructive">*</span></Label>
			<Input name="username" value={u?.username ?? ''} required autocomplete="off" />
			{#if errors.username}<p class="text-xs text-destructive">{errors.username}</p>{/if}
		</div>
		<div class="space-y-1.5">
			<Label>ตำแหน่ง</Label>
			<Input name="position" value={u?.position ?? ''} />
		</div>
		<div class="space-y-1.5">
			<Label>อีเมล</Label>
			<Input name="email" type="email" value={u?.email ?? ''} />
		</div>
		<div class="space-y-1.5">
			<Label>สิทธิ์</Label>
			<NativeSelect name="role" value={u?.role ?? 'member'}>
				<option value="member">{ROLE_LABELS.member}</option>
				<option value="admin">{ROLE_LABELS.admin}</option>
			</NativeSelect>
			{#if errors.role}<p class="text-xs text-destructive">{errors.role}</p>{/if}
		</div>
		<div class="space-y-1.5">
			<Label>ระดับ (1–10)</Label>
			<Input name="level" type="number" min="1" max="10" value={u?.level ?? 1} />
		</div>
		<div class="space-y-1.5">
			<Label>วันเริ่มงาน</Label>
			<Input name="startDate" type="date" value={u?.startDate ?? ''} />
		</div>
		<div class="space-y-1.5">
			<Label>{u ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'} {#if !u}<span class="text-destructive">*</span>{/if}</Label>
			<Input name="password" type="password" autocomplete="new-password" required={!u} />
			{#if errors.password}<p class="text-xs text-destructive">{errors.password}</p>{/if}
		</div>
		<div class="space-y-1.5 sm:col-span-2">
			<Label>หน้าที่หลัก</Label>
			<Textarea name="duties" rows={2} value={u?.duties ?? ''} />
		</div>
		{#if u}
			<label class="flex items-center gap-2 text-sm sm:col-span-2">
				<input type="hidden" name="active" value="off" />
				<input type="checkbox" name="active" value="on" checked={u.active} class="size-4" />
				เปิดใช้งานบัญชี (ปิด = Login ไม่ได้ แต่ข้อมูลและประวัติยังอยู่)
			</label>
		{/if}
	</div>
{/snippet}

<PageHeader title="จัดการพนักงาน" description="{data.employees.filter((e) => e.active).length} คนที่ใช้งานอยู่">
	<Dialog.Root bind:open={createOpen}>
		<Dialog.Trigger>
			{#snippet child({ props })}<Button {...props}>+ เพิ่มพนักงาน</Button>{/snippet}
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-2xl">
			<form
				method="POST"
				action="?/create"
				class="space-y-4"
				use:enhance={() => async ({ result, update }) => {
					if (result.type === 'success') createOpen = false;
					await update();
				}}
			>
				<Dialog.Header><Dialog.Title>เพิ่มพนักงานใหม่</Dialog.Title></Dialog.Header>
				{@render userFields(null)}
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
				<Dialog.Footer><Button type="submit">สร้างบัญชี</Button></Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</PageHeader>

<Card.Root>
	<Card.Content class="overflow-x-auto">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>ชื่อ</Table.Head>
					<Table.Head>Username</Table.Head>
					<Table.Head>ตำแหน่ง</Table.Head>
					<Table.Head>สิทธิ์</Table.Head>
					<Table.Head>ระดับ</Table.Head>
					<Table.Head>วันเริ่มงาน</Table.Head>
					<Table.Head class="text-right">งานค้าง / ทั้งหมด</Table.Head>
					<Table.Head>สถานะ</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.employees as u (u.id)}
					<Table.Row class={u.active ? '' : 'opacity-50'}>
						<Table.Cell>
							<div class="font-medium">{u.name}</div>
							<div class="text-xs text-muted-foreground">{u.email}</div>
						</Table.Cell>
						<Table.Cell class="font-mono text-xs">{u.username}</Table.Cell>
						<Table.Cell>
							<div>{u.position}</div>
							<div class="line-clamp-1 max-w-64 text-xs text-muted-foreground" title={u.duties}>{u.duties}</div>
						</Table.Cell>
						<Table.Cell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{ROLE_LABELS[u.role]}</Badge></Table.Cell>
						<Table.Cell>{u.level}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{fmtDate(u.startDate)}</Table.Cell>
						<Table.Cell class="text-right"><a href="/board?assignee={u.id}" class="hover:underline">{u.openTasks} / {u.totalTasks}</a></Table.Cell>
						<Table.Cell>{#if u.active}<Badge variant="outline" class="border-emerald-300 text-emerald-700">ใช้งาน</Badge>{:else}<Badge variant="outline">ปิด</Badge>{/if}</Table.Cell>
						<Table.Cell class="text-right whitespace-nowrap">
							<Button variant="ghost" size="icon-sm" onclick={() => (editing = u)} aria-label="แก้ไข"><PencilIcon /></Button>
							<Button variant="ghost" size="icon-sm" class="text-destructive" disabled={u.id === data.user?.id} onclick={() => (deleting = u)} aria-label="ลบ"><Trash2Icon /></Button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>

<Dialog.Root open={editing !== null} onOpenChange={(o) => !o && (editing = null)}>
	<Dialog.Content class="sm:max-w-2xl">
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
				<Dialog.Header><Dialog.Title>แก้ไข: {editing.name}</Dialog.Title></Dialog.Header>
				{@render userFields(editing)}
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
				<Dialog.Footer><Button type="submit">บันทึก</Button></Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root open={deleting !== null} onOpenChange={(o) => !o && (deleting = null)}>
	<Dialog.Content>
		{#if deleting}
			<Dialog.Header>
				<Dialog.Title>ลบพนักงาน {deleting.name}?</Dialog.Title>
				<Dialog.Description>
					งาน {deleting.totalTasks} รายการที่รับผิดชอบจะกลายเป็น "ยังไม่ระบุผู้รับผิดชอบ" และประวัติใน Activity Log ยังคงอยู่
					แนะนำให้ใช้ "ปิดใช้งานบัญชี" แทนหากต้องการเก็บข้อมูลไว้
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="ghost" onclick={() => (deleting = null)}>ยกเลิก</Button>
				<form method="POST" action="?/delete" use:enhance={() => async ({ update }) => { deleting = null; await update(); }}>
					<input type="hidden" name="id" value={deleting.id} />
					<Button type="submit" variant="destructive">ยืนยันลบ</Button>
				</form>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
