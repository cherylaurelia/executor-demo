export interface BenchRun {
  build: string;
  prompt: string;
  firstStyle: string;
  firstOutcome: string;
  calls: number;
  created: boolean;
}

export interface BenchTally {
  runs: number;
  firstCallRejected: number;
  neverCreated: number;
  firstCallCreated: number;
}

/** How one build's runs went: rejected first calls, runs that gave up, first-try successes. */
export function tally(runs: readonly BenchRun[]): BenchTally {
  return {
    runs: runs.length,
    firstCallRejected: runs.filter((run) => run.firstOutcome !== "created").length,
    neverCreated: runs.filter((run) => !run.created).length,
    firstCallCreated: runs.filter((run) => run.firstOutcome === "created").length,
  };
}

export function released(runs: readonly BenchRun[]): BenchRun[] {
  return runs.filter((run) => run.build.startsWith("released"));
}

export function fixed(runs: readonly BenchRun[]): BenchRun[] {
  return runs.filter((run) => run.build === "fix branch");
}
