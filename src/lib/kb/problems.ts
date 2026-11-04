// The problems inside one big ticket. causes.ts says which bug a report's tenant and channel point
// to; a report the desk read as a one-day move (desk-notes.json) is its own problem, whatever its
// tenant. Every count on the problems page comes from here.
import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'The shared parser reads day-first dates month first',
    what: 'A day-first tenant books 7 April; the invite says 4 July.',
  },
  hint: {
    title: 'The booking-v3 form tells day-first tenants to type the month first',
    what: 'Its date field prints MM/DD/YYYY, people follow it, and the form reads the date day first.',
  },
  'one-day': {
    title: 'Bookings move by one day',
    what: 'Same month, one day earlier or later: a time zone fault, not a swapped month.',
  },
  unplaced: {
    title: 'No tenant on file',
    what: 'The desk cannot tell which bug these belong to.',
  },
};

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // What intake tagged these reports as: tag → count. A guess from the browser, not the cause.
  taggedAs: Record<string, number>;
};

export function problemOf(r: Report, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}

// The reports merged into one ticket, once each, split by problem, biggest first.
export function problemsIn(ticket: number, all: Report[], oneDayMove: readonly string[]) {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(rows);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups: ProblemGroup[] = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: rows.length, copies: rows.length - merged.length, merged: merged.length, groups };
}
