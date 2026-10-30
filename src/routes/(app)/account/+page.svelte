<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import { ROLE_LABELS } from '#lib/labels.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>บัญชีของฉัน · Project Tracker</title></svelte:head>

<PageHeader title="บัญชีของฉัน" />

<div class="grid max-w-3xl gap-5 md:grid-cols-2">
	<Card.Root>
		<Card.Header><Card.Title>ข้อมูลผู้ใช้</Card.Title></Card.Header>
		<Card.Content class="space-y-2 text-sm">
			<div><span class="text-muted-foreground">ชื่อ:</span> {data.user?.name}</div>
			<div><span class="text-muted-foreground">Username:</span> <code>{data.user?.username}</code></div>
			<div><span class="text-muted-foreground">ตำแหน่ง:</span> {data.user?.position || '—'}</div>
			<div><span class="text-muted-foreground">อีเมล:</span> {data.user?.email || '—'}</div>
			<div><span class="text-muted-foreground">สิทธิ์:</span> {ROLE_LABELS[data.user?.role ?? 'member']}</div>
			<p class="pt-2 text-xs text-muted-foreground">ต้องการแก้ไขข้อมูล? ติดต่อ Admin</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title>เปลี่ยนรหัสผ่าน</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-3">
				<div class="space-y-1.5"><Label for="current">รหัสผ่านปัจจุบัน</Label><Input id="current" name="current" type="password" autocomplete="current-password" required /></div>
				<div class="space-y-1.5"><Label for="next">รหัสผ่านใหม่</Label><Input id="next" name="next" type="password" autocomplete="new-password" required /></div>
				<div class="space-y-1.5"><Label for="confirm">ยืนยันรหัสผ่านใหม่</Label><Input id="confirm" name="confirm" type="password" autocomplete="new-password" required /></div>
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
				{#if form?.ok}<p class="text-sm text-emerald-600">เปลี่ยนรหัสผ่านแล้ว ✓</p>{/if}
				<Button type="submit">บันทึก</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
