<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import NativeSelect from '#lib/components/NativeSelect.svelte';
	import { STATUS_LABELS, STATUS_ORDER, PRIORITY_LABELS } from '#lib/labels.js';
	import { PRIORITIES } from '#lib/constants.js';

	interface Props {
		task?: Partial<{
			code: string;
			projectId: number;
			title: string;
			assigneeId: number | null;
			priority: string;
			status: string;
			startDate: string | null;
			dueDate: string | null;
			estimateHours: number;
			actualHours: number;
			progress: number;
			notes: string;
		}> | null;
		projects: { id: number; name: string }[];
		users: { id: number; name: string; position: string }[];
		errors?: Record<string, string>;
		/** พนักงานทั่วไปแก้ได้เฉพาะ field ที่เกี่ยวกับความคืบหน้า */
		limited?: boolean;
	}

	let { task = null, projects, users, errors = {}, limited = false }: Props = $props();
</script>

<div class="grid gap-4 md:grid-cols-2">
	<div class="space-y-1.5 md:col-span-2">
		<Label for="title">ชื่องาน <span class="text-destructive">*</span></Label>
		<Input id="title" name="title" value={task?.title ?? ''} required disabled={limited} />
		{#if errors.title}<p class="text-xs text-destructive">{errors.title}</p>{/if}
	</div>

	<div class="space-y-1.5">
		<Label for="code">รหัสงาน</Label>
		<Input id="code" name="code" value={task?.code ?? ''} placeholder="สร้างอัตโนมัติ" disabled={limited} />
	</div>

	<div class="space-y-1.5">
		<Label for="projectId">ลูกค้า / โปรเจกต์ <span class="text-destructive">*</span></Label>
		<NativeSelect id="projectId" name="projectId" value={task?.projectId ?? ''} required disabled={limited}>
			<option value="" disabled>— เลือกโปรเจกต์ —</option>
			{#each projects as p (p.id)}
				<option value={p.id}>{p.name}</option>
			{/each}
		</NativeSelect>
		{#if errors.projectId}<p class="text-xs text-destructive">{errors.projectId}</p>{/if}
	</div>

	<div class="space-y-1.5">
		<Label for="assigneeId">ผู้รับผิดชอบ</Label>
		<NativeSelect id="assigneeId" name="assigneeId" value={task?.assigneeId ?? ''} disabled={limited}>
			<option value="">— ยังไม่ระบุ —</option>
			{#each users as u (u.id)}
				<option value={u.id}>{u.name} · {u.position}</option>
			{/each}
		</NativeSelect>
	</div>

	<div class="space-y-1.5">
		<Label for="priority">ความสำคัญ</Label>
		<NativeSelect id="priority" name="priority" value={task?.priority ?? 'medium'} disabled={limited}>
			{#each PRIORITIES as p (p)}
				<option value={p}>{PRIORITY_LABELS[p]}</option>
			{/each}
		</NativeSelect>
	</div>

	<div class="space-y-1.5">
		<Label for="status">สถานะ</Label>
		<NativeSelect id="status" name="status" value={task?.status ?? 'todo'}>
			{#each STATUS_ORDER as s (s)}
				<option value={s}>{STATUS_LABELS[s]}</option>
			{/each}
		</NativeSelect>
	</div>

	<div class="space-y-1.5">
		<Label for="progress">% ความคืบหน้า</Label>
		<Input id="progress" name="progress" type="number" min="0" max="100" step="5" value={task?.progress ?? 0} />
	</div>

	<div class="space-y-1.5">
		<Label for="startDate">วันเริ่ม</Label>
		<Input id="startDate" name="startDate" type="date" value={task?.startDate ?? ''} disabled={limited} />
	</div>

	<div class="space-y-1.5">
		<Label for="dueDate">กำหนดเสร็จ</Label>
		<Input id="dueDate" name="dueDate" type="date" value={task?.dueDate ?? ''} disabled={limited} />
		{#if errors.dueDate}<p class="text-xs text-destructive">{errors.dueDate}</p>{/if}
	</div>

	<div class="space-y-1.5">
		<Label for="estimateHours">ชั่วโมงประเมิน</Label>
		<Input id="estimateHours" name="estimateHours" type="number" min="0" step="0.5" value={task?.estimateHours ?? 0} disabled={limited} />
	</div>

	<div class="space-y-1.5">
		<Label for="actualHours">ชั่วโมงใช้จริง</Label>
		<Input id="actualHours" name="actualHours" type="number" min="0" step="0.5" value={task?.actualHours ?? 0} />
	</div>

	<div class="space-y-1.5 md:col-span-2">
		<Label for="notes">หมายเหตุ</Label>
		<Textarea id="notes" name="notes" rows={3} value={task?.notes ?? ''} />
	</div>
</div>

{#if limited}
	<!-- ส่ง field ที่ disabled ไปด้วยเพื่อให้ parseTaskForm ครบ -->
	<input type="hidden" name="title" value={task?.title ?? ''} />
	<input type="hidden" name="code" value={task?.code ?? ''} />
	<input type="hidden" name="projectId" value={task?.projectId ?? ''} />
	<input type="hidden" name="assigneeId" value={task?.assigneeId ?? ''} />
	<input type="hidden" name="priority" value={task?.priority ?? 'medium'} />
	<input type="hidden" name="startDate" value={task?.startDate ?? ''} />
	<input type="hidden" name="dueDate" value={task?.dueDate ?? ''} />
	<input type="hidden" name="estimateHours" value={task?.estimateHours ?? 0} />
{/if}
