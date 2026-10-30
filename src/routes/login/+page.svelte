<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import KanbanIcon from '@lucide/svelte/icons/kanban';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>เข้าสู่ระบบ · Project Tracker</title></svelte:head>

<div class="flex min-h-svh items-center justify-center bg-muted/40 p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="text-center">
			<div class="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<KanbanIcon class="size-6" />
			</div>
			<Card.Title class="text-xl">Project Tracker</Card.Title>
			<Card.Description>ทีมการตลาดดิจิทัล — เข้าสู่ระบบด้วยบัญชีของคุณ</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<div class="space-y-1.5">
					<Label for="username">Username</Label>
					<Input id="username" name="username" value={form?.username ?? ''} autocomplete="username" required autofocus />
				</div>
				<div class="space-y-1.5">
					<Label for="password">รหัสผ่าน</Label>
					<Input id="password" name="password" type="password" autocomplete="current-password" required />
				</div>
				{#if form?.message}
					<p class="text-sm text-destructive">{form.message}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="flex-col gap-1 text-xs text-muted-foreground">
			<p>บัญชีทดสอบ: <code>admin / Admin1234</code>, <code>vipa / Admin1234</code></p>
			<p>พนักงาน: <code>napa / Pass1234</code> (ใช้ username จากอีเมล)</p>
		</Card.Footer>
	</Card.Root>
</div>
