<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { PROBLEMS, problemsIn } from '#lib/kb/problems';
  import type { Report } from '#lib/kb/causes';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(problemsIn(ticket, reports as Report[], notes.oneDayMove));
  const tags = (t: Record<string, number>) =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
  {#if split.copies}<span class="muted">· the export repeats {split.copies} of them ({split.rows} rows), counted once</span>{/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>intake tagged them</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><b>{PROBLEMS[g.problem].title}</b><br /><span class="muted">{PROBLEMS[g.problem].what}</span></td>
        <td class="n">{g.reports.length}</td>
        <td class="n">{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td class="muted">{tags(g.taggedAs)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .n { text-align: right; font-variant-numeric: tabular-nums; }
</style>
