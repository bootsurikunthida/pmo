<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import NativeSelect from '#lib/components/NativeSelect.svelte';
	import ActivityItem from '#lib/components/ActivityItem.svelte';
	import { ACTION_LABELS, ENTITY_LABELS } from '#lib/labels.js';
	import { ACTIVITY_ACTIONS, ENTITY_TYPES } from '#lib/constants.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function setFilter(key: string, value: string) {
		const u = new URL(page.url.href);
		if (value) u.searchParams.set(key, value);
		else u.searchParams.delete(key);
		u.searchParams.delete('page');
		goto(u.pathname + u.search, { reset: false });
	}
	function pageHref(n: number) {
		const u = new URL(page.url.href);
		u.searchParams.set('page', String(n));
		return u.pathname + u.search;
	}
</script>

<svelte:head><title>Activity Log · Project Tracker</title></svelte:head>

<PageHeader title="Activity Log" description="บันทึกว่าใครแก้อะไรเมื่อไร — {data.total} รายการ">
	<NativeSelect class="w-36" value={data.filter.entity ?? ''} onchange={(e) => setFilter('entity', (e.currentTarget as HTMLSelectElement).value)}>
		<option value="">ทุกประเภท</option>
		{#each ENTITY_TYPES as t (t)}<option value={t}>{ENTITY_LABELS[t]}</option>{/each}
	</NativeSelect>
	<NativeSelect class="w-36" value={data.filter.action ?? ''} onchange={(e) => setFilter('action', (e.currentTarget as HTMLSelectElement).value)}>
		<option value="">ทุกการกระทำ</option>
		{#each ACTIVITY_ACTIONS as a (a)}<option value={a}>{ACTION_LABELS[a]}</option>{/each}
	</NativeSelect>
	<NativeSelect class="w-40" value={data.filter.actorId ?? ''} onchange={(e) => setFilter('actor', (e.currentTarget as HTMLSelectElement).value)}>
		<option value="">ทุกคน</option>
		{#each data.actors as a (a.id)}<option value={a.id}>{a.name}</option>{/each}
	</NativeSelect>
</PageHeader>

<Card.Root>
	<Card.Content class="divide-y">
		{#each data.logs as log (log.id)}
			<ActivityItem {log} />
		{:else}
			<p class="py-8 text-center text-sm text-muted-foreground">ไม่มีรายการ</p>
		{/each}
	</Card.Content>
	{#if data.pages > 1}
		<Card.Footer class="justify-between">
			<Button variant="outline" size="sm" href={pageHref(data.page - 1)} disabled={data.page <= 1}>← ก่อนหน้า</Button>
			<span class="text-sm text-muted-foreground">หน้า {data.page} / {data.pages}</span>
			<Button variant="outline" size="sm" href={pageHref(data.page + 1)} disabled={data.page >= data.pages}>ถัดไป →</Button>
		</Card.Footer>
	{/if}
</Card.Root>
