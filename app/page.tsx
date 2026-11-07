import page from "@/data/page.json";
import { type BenchRun, fixed, released, tally } from "@/lib/runs";

type Run = typeof page.before;

const BRANCH = "https://github.com/cherylaurelia/executor/tree/fix/nested-json-schema";
const COMMIT = "https://github.com/cherylaurelia/executor/commit/8b06095b25e3d44337c47c49944d784950748579";
const ISSUE = "https://github.com/UsefulSoftwareCo/executor/issues/2472";
const REPO = "https://github.com/cherylaurelia/executor-demo";

const APP_SOURCE = `import { defineApp, jsonSchema, literal, object, query, router } from "apps";

export default defineApp({}, {
  tools: router({
    paint: query({
      description: "Echo a color.",
      input: object({
        nested: jsonSchema({ type: "string", enum: ["red", "blue"] }),
        literalField: literal("red"),
      }),
    }, async (_ctx, input) => ({ color: input.nested })),
  }),
});`;

const FIX_SOURCE = `const decoder = EffectSchema.declareConstructor<EffectSchema.Json>()(
  [],
  () => (input, _ast, options) => /* unchanged: compile, then validate */,
  {
    // Describe the document where the schema is nested too, as \`Schema.Date\`
    // describes its string. A document with references or identifiers reads
    // differently away from its root, so it stays undescribed there.
    toCodecJson: () =>
      EffectSchema.link<EffectSchema.Json>()(
        EffectSchema.Json.check(
          EffectSchema.makeFilter(() => true, {
            toJsonSchema: () => {
              const document = read();
              return isStandalone(document) ? document : [{}, true];
            },
          }),
        ),
        SchemaTransformation.passthrough(),
      ),
  },
);`;

function Code({ children, tone, wrap }: { children: string; tone?: "bad" | "good"; wrap?: boolean }) {
  const border = tone === "bad" ? "border-bad/40" : tone === "good" ? "border-sage" : "border-rule";

  return (
    <pre
      tabIndex={0}
      className={`overflow-x-auto rounded-md border ${border} ${wrap ? "whitespace-pre-wrap break-words" : ""} bg-surface-2 p-3 font-mono text-[12.5px] leading-relaxed`}
    >
      <code>{children}</code>
    </pre>
  );
}

function Column({ run, tone, title }: { run: Run; tone: "bad" | "good"; title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="font-mono text-[11px] text-ink-2">{run.label}</span>
      </div>
      <p className="text-xs text-ink-2">search: the input type an agent reads first</p>
      <Code tone={tone}>{run.searchInput}</Code>
      <p className="text-xs text-ink-2">describe: the full signature</p>
      <Code tone={tone}>{run.signature}</Code>
      <p className="text-xs text-ink-2">call with nested: &quot;green&quot;, then &quot;red&quot;</p>
      <Code wrap>{`${run.wrongCall}\n${run.rightCall}`}</Code>
      {tone === "good" ? (
        <p className="text-xs text-ink-2">
          Same 422 on purpose: validation is unchanged. The agent can now see the values first.
        </p>
      ) : null}
    </div>
  );
}

function BenchTable({ runs }: { runs: BenchRun[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-rule" tabIndex={0}>
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-surface-2 text-xs text-ink-2">
          <tr>
            <th className="px-3 py-2 font-medium">Build</th>
            <th className="px-3 py-2 font-medium">Task</th>
            <th className="px-3 py-2 font-medium">First style sent</th>
            <th className="px-3 py-2 font-medium">First call</th>
            <th className="px-3 py-2 font-medium">Calls</th>
            <th className="px-3 py-2 font-medium">Button made</th>
          </tr>
        </thead>
        <tbody className="font-mono text-[12.5px]">
          {runs.map((run, index) => (
            <tr key={`${run.build}-${run.prompt}-${index}`} className="border-t border-rule">
              <td className="px-3 py-1.5">{run.build}</td>
              <td className="px-3 py-1.5">{run.prompt}</td>
              <td className="px-3 py-1.5">{run.firstStyle}</td>
              <td
                className={`px-3 py-1.5 ${run.firstOutcome === "created" ? "text-sage-text" : "text-bad"}`}
              >
                {run.firstOutcome}
              </td>
              <td className="px-3 py-1.5">{run.calls}</td>
              <td className={`px-3 py-1.5 ${run.created ? "" : "font-semibold text-bad"}`}>
                {run.created ? "yes" : "no"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinkButton({ href, children, primary }: { href: string; children: string; primary?: boolean }) {
  const look = primary
    ? "bg-ink text-surface hover:bg-[#333]"
    : "border border-rule bg-surface hover:bg-surface-2";

  return (
    <a href={href} className={`rounded-md px-3.5 py-2 text-sm font-medium ${look}`}>
      {children}
    </a>
  );
}

export default function Page() {
  const { before, after, bench } = page;
  const releasedRuns = tally(released(bench));
  const fixedRuns = tally(fixed(bench));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-12 sm:py-16">
      <header className="flex flex-col gap-5">
        <p className="font-mono text-xs text-ink-2">
          Executor · apps framework · issue #2472 · reproduced 2026-11-07
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          A <code className="font-mono">jsonSchema()</code> field inside{" "}
          <code className="font-mono">object()</code> reaches agents as{" "}
          <code className="font-mono">unknown</code>, but its call is still validated.
        </h1>
        <p className="max-w-3xl text-lg text-ink-2">
          A <code className="font-mono">toCodecJson</code> link on the lazy decoder, the way{" "}
          <code className="font-mono">Schema.Date</code> is described, lists the document where it
          sits. That&apos;s about 20 lines in <code className="font-mono">schema.ts</code>, and
          validation doesn&apos;t change.
        </p>
        <p className="text-sm text-ink-2">
          Headless Claude Code on a nested style list, 6 runs per build (details below):
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-bad/40 bg-bad-wash p-4">
            <p className="text-2xl font-semibold">
              {releasedRuns.firstCallRejected} of {releasedRuns.runs}
            </p>
            <p className="text-sm text-ink-2">released runs had their first call rejected (422)</p>
          </div>
          <div className="rounded-md border border-bad/40 bg-bad-wash p-4">
            <p className="text-2xl font-semibold">
              {releasedRuns.neverCreated} of {releasedRuns.runs}
            </p>
            <p className="text-sm text-ink-2">released runs stopped without making the button</p>
          </div>
          <div className="rounded-md border border-sage bg-sage-wash p-4">
            <p className="text-2xl font-semibold">
              {fixedRuns.firstCallCreated} of {fixedRuns.runs}
            </p>
            <p className="text-sm text-ink-2">runs on the fix made it with their first call</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={BRANCH} primary>
            Fix branch
          </LinkButton>
          <LinkButton href="/executor-nested-json-schema.patch">Patch file</LinkButton>
          <LinkButton href={ISSUE}>Issue #2472</LinkButton>
          <LinkButton href={REPO}>Demo repo</LinkButton>
        </div>
        <p className="max-w-3xl text-sm text-ink-2">
          Outside pull requests can&apos;t be opened on the repo right now, so the fix is a signed
          commit on a fork branch and a patch you can apply with{" "}
          <code className="font-mono">git am</code>.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">The app from the issue, deployed unchanged</h2>
        <Code>{APP_SOURCE}</Code>
        <p className="text-sm text-ink-2">
          Deployed with <code className="font-mono">executor apps deploy</code> and queried over
          the real MCP endpoint (<code className="font-mono">search</code>,{" "}
          <code className="font-mono">describe</code>, <code className="font-mono">call</code>).
          Left: the released 2.0.0-beta.37 CLI. Right: a server built from the branch, with the
          branch&apos;s <code className="font-mono">apps</code> package served from a local
          registry.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <Column run={before} tone="bad" title="Today" />
          <Column run={after} tone="good" title="With the fix" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">What an agent does with &quot;unknown&quot;</h2>
        <p className="max-w-3xl text-ink-2">
          A small button app with a nested style list,{" "}
          <code className="font-mono">jsonSchema(&#123; enum: [&quot;solid&quot;, &quot;outline&quot;, &quot;ghost&quot;] &#125;)</code>
          , deployed to both servers. Headless Claude Code (Sonnet) got only the Executor MCP tools,
          and two tasks: &quot;create an outlined button labeled Save&quot; and &quot;create a
          borderless, transparent-background button labeled Cancel&quot;. Each task ran 3 times
          per build, in alternating order.
        </p>
        <p className="text-xs text-ink-2 sm:hidden">Scroll the table sideways for every column.</p>
        <BenchTable runs={bench} />
        <p className="text-sm text-ink-2">
          The button app is my own test fixture, not a real Executor app. It&apos;s built to show
          the cost when a value isn&apos;t the obvious guess. Twelve runs is small; the tool inputs
          and outcomes are in <code className="font-mono">data/captures/bench.json</code> in the demo repo.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">The change</h2>
        <p className="max-w-3xl text-ink-2">
          <code className="font-mono">jsonSchema()</code> keeps its document under a private
          symbol, and only <code className="font-mono">jsonSchemaDocument()</code> reads it, at the
          top level. Nested, Effect reaches the declaration and renders it as{" "}
          <code className="font-mono">&#123;&#125;</code> unless the declaration links to a JSON
          codec. The branch adds that link in{" "}
          <code className="font-mono">lazyCompiledDecoder</code>:
        </p>
        <Code>{FIX_SOURCE}</Code>
        <ul className="flex max-w-3xl list-disc flex-col gap-1.5 pl-5 text-sm text-ink-2">
          <li>
            Nested in <code className="font-mono">object()</code>, in{" "}
            <code className="font-mono">array()</code> items, and with{" "}
            <code className="font-mono">.optional()</code> (as{" "}
            <code className="font-mono">anyOf [doc, null]</code>, like{" "}
            <code className="font-mono">string().optional()</code>), the document is listed as-is.
          </li>
          <li>
            A document with <code className="font-mono">$ref</code>,{" "}
            <code className="font-mono">$defs</code> or an identifier still lists as{" "}
            <code className="font-mono">&#123;&#125;</code> when nested, using your own{" "}
            <code className="font-mono">rootDefinitions</code> check. Top-level output is the same
            as before, and the OpenAPI, MCP-proxy and GraphQL decoders all sit at the top level.
          </li>
          <li>
            Test: <code className="font-mono">imported-json-schema-documents.spec.ts</code> lists{" "}
            <code className="font-mono">paint</code> and checks each property exactly, plus 5
            calls. It fails on v2 and passes on the branch. Dropping the{" "}
            <code className="font-mono">$ref</code> guard also fails it.{" "}
            <code className="font-mono">bun run check</code> passes, and the self-host scenarios
            matching OpenAPI, schema, search, describe and GraphQL pass too (47 passed, 0 failed).
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={COMMIT}>View the commit</LinkButton>
          <LinkButton href={BRANCH}>Fix branch</LinkButton>
        </div>
      </section>

      <footer className="border-t border-rule pt-6 text-sm text-ink-2">
        Unofficial demo by Cheryl Aurelia: not affiliated with Executor. Captured 2026-11-07
        against local installs; no Executor account was used.
      </footer>
    </main>
  );
}
