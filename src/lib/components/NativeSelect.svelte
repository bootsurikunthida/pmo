<script lang="ts">
	import { cn } from '#lib/utils.js';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let {
		class: className,
		value = $bindable(),
		children,
		...rest
	}: HTMLSelectAttributes & { value?: string | number | null } = $props();
</script>

<select
	bind:value
	class={cn(
		'border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...rest}
>
	{@render children?.()}
</select>
