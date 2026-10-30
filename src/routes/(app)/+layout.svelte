<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { cn } from '#lib/utils.js';
	import { ROLE_LABELS } from '#lib/labels.js';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import KanbanIcon from '@lucide/svelte/icons/kanban';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import FolderKanbanIcon from '@lucide/svelte/icons/folder-kanban';
	import UsersIcon from '@lucide/svelte/icons/users';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let open = $state(false);

	const nav = $derived([
		{ href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/board', label: 'Kanban Board', icon: KanbanIcon },
		{ href: '/tasks', label: 'งานทั้งหมด', icon: ListChecksIcon },
		{ href: '/projects', label: 'โปรเจกต์', icon: FolderKanbanIcon },
		...(data.user?.role === 'admin'
			? [{ href: '/employees', label: 'พนักงาน', icon: UsersIcon }]
			: []),
		{ href: '/activity', label: 'Activity Log', icon: HistoryIcon }
	]);

	function isActive(href: string) {
		const p = page.url.pathname;
		return href === '/' ? p === '/' : p === href || p.startsWith(href + '/');
	}
</script>

<div class="flex min-h-svh bg-muted/30">
	<!-- Sidebar -->
	<aside
		class={cn(
			'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0',
			open ? 'translate-x-0' : '-translate-x-full'
		)}
	>
		<div class="flex h-14 items-center gap-2 px-4">
			<div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<KanbanIcon class="size-4" />
			</div>
			<div class="leading-tight">
				<div class="text-sm font-semibold">Project Tracker</div>
				<div class="text-[11px] text-muted-foreground">ทีมการตลาดดิจิทัล</div>
			</div>
		</div>
		<Separator />
		<nav class="flex-1 space-y-0.5 p-2">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					onclick={() => (open = false)}
					class={cn(
						'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent',
						isActive(item.href) && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
					)}
				>
					<item.icon class="size-4 text-muted-foreground" />
					{item.label}
				</a>
			{/each}
		</nav>
		<Separator />
		<div class="space-y-2 p-3">
			<div class="flex items-center gap-2.5 px-1">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
					{data.user?.name.slice(0, 1)}
				</div>
				<div class="min-w-0 leading-tight">
					<div class="truncate text-sm font-medium">{data.user?.name}</div>
					<div class="truncate text-[11px] text-muted-foreground">{data.user?.position || ROLE_LABELS[data.user?.role ?? 'member']}</div>
				</div>
			</div>
			<div class="flex gap-1">
				<Button href="/account" variant="ghost" size="sm" class="flex-1 justify-start">
					<KeyRoundIcon /> รหัสผ่าน
				</Button>
				<form method="POST" action="/logout" use:enhance class="flex-1">
					<Button type="submit" variant="ghost" size="sm" class="w-full justify-start">
						<LogOutIcon /> ออก
					</Button>
				</form>
			</div>
		</div>
	</aside>

	{#if open}
		<button class="fixed inset-0 z-30 bg-black/30 md:hidden" aria-label="ปิดเมนู" onclick={() => (open = false)}></button>
	{/if}

	<!-- Main -->
	<div class="flex min-w-0 flex-1 flex-col">
		<header class="flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
			<Button variant="ghost" size="icon" onclick={() => (open = !open)} aria-label="เมนู"><MenuIcon /></Button>
			<span class="font-semibold">Project Tracker</span>
			<Badge variant="secondary" class="ml-auto">{data.user?.name}</Badge>
		</header>
		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</div>
</div>
