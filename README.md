# SLYE - Speak like you eat

<p align="center">
  <img src="./imgs/front.png" alt="Speak like you eat" width="720">
</p>

<h6 align="center"><i>Translate AI garbage to human language</i></h6>

SLYE is a Pi and Oh My Pi (OMP) package that adds a plain-language rewrite after a completed response.

In Italian, “speak like you eat” (*parla come mangi*) means being straightforward instead of using big, clever, empty words. SLYE applies that idea to AI output.

*Deliberately inspired by [Claudish to English](https://github.com/gvzdv/claudish-to-english)*

## Install

### Pi

```sh
# Available to all projects
pi install npm:speak-like-you-eat

# Available only in the current project
pi install -l npm:speak-like-you-eat
```

### Oh My Pi

```sh
omp plugin install speak-like-you-eat
```

## Use

1. After Pi or OMP finishes an answer, run `/slye` for an eligible target. It rewrites the latest completed assistant response once and adds a plain-language rewrite card below the unchanged original; if you have typed a follow-up since, there is no target.
2. If no usable model exists, `/slye` opens the model and scope picker, saves the chosen model with automatic rewriting off, globally or, in a trusted project, locally, and immediately performs the rewrite.
3. If you want eligible answers rewritten automatically, run `/slye on`. Run `/slye off` to stop automatic rewriting while keeping `/slye` available.

| Command | What it does |
| --- | --- |
| `/slye` | Rewrite the latest completed assistant response on demand. |
| `/slye model` | Choose a model without changing a valid automatic on/off state; first-time setup saves automatic rewriting off. Tab switches between scoped and all authenticated eligible models when the host provides scoped models. |
| `/slye on` | Enable automatic rewriting, or choose a model and enable it when no usable model is saved. |
| `/slye off` | Disable automatic rewriting; manual `/slye` remains available. |

### ELI5 and Light tabs (Pi)

On Pi, each card holds two versions of the rewrite, shown as tabs on its heading line:

- **ELI5** (active by default): rebuilds the answer for a reader who wants the point fast. It starts with the conclusion and what you need to do, then lists what was done, the steps, the key facts, and the open decisions, in plain words and at about half the length, while keeping every fact. Adapted from the [unslop](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md) and [i-have-adhd](https://github.com/ayghri/i-have-adhd) skills.
- **Light**: the lighter rewrite SLYE has always made, close to the original wording, or your custom prompt's output.

Click a tab in fullscreen mode, or press `ctrl+\` in any mode, to switch. The choice applies to every card and resets when Pi restarts. On Pi each rewrite makes two provider requests, in parallel, so it costs about twice as much as one version. OMP shows only the Light version, without tabs.

SLYE automatically uses the selected model's lowest supported thinking level. Automatic rewriting requires a normally completed final response with at least 200 non-whitespace prose characters outside fenced code. Manual `/slye` uses the same normal-completion, prose, and no-tool-call requirements, but has no 200-character minimum.

### Custom system prompt

To replace the built-in Light prompt with your own `slye-prompt.md`, follow [Customize the SLYE system prompt](backlog/docs/runbooks/doc-6%20-%20Customize-the-SLYE-system-prompt.md).

### Recommended models

Use cheap-ish, fast models with low or no reasoning; SLYE sets reasoning for you. Both Pi tabs use the same model.

- **Claude Haiku 5.5** - best ELI5 results in my trials: it restructures well, keeps the facts, and roughly halves long answers
- **GPT-6 Luna** - good ELI5 and the shortest output, not the fastest
- **DeepSeek V4.1 Flash** - the fastest; good Light rewrites and a correct ELI5 structure, but it shortens long answers less

Avoid models that write their reasoning into the answer (for example GLM 5.3 Flash), and GPT-OSS 20B, which translated Italian answers into English and invented steps in ELI5. These ELI5 notes come from a small manual trial on six real answers; the scored [benchmark](backlog/docs/specs/doc-4%20-%20SLYE-benchmark-results.md) covers only the Light prompt.

## What SLYE guarantees

- The original response stays visible and unchanged. The display-only card never enters LLM context.
- SLYE's built-in Light prompt tells the model to preserve the target response's language and intentional language mix rather than translate it. The ELI5 prompt keeps the response's main language but may reorder it and change its Markdown structure. A custom prompt replaces those instructions for the Light version only. The ELI5 prompt replaces business jargon in other languages, such as English buzzwords in an Italian answer, with plain words in the answer's language.
- Each target has at most one persistent companion card. Secondary provider requests (two on Pi, one on OMP) have their own cost and latency and happen only for an automatically eligible response or an eligible, not-yet-completed manual target.
- Escape cancels a rewrite. Cancellation, timeout, and provider failures leave the original unchanged and permit a manual retry. Storage failures have [host-specific retry limitations](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md#interaction-and-failures).
- SLYE sends an isolated payload to the selected model through the host's model registry. Apart from its explicit configuration and optional `slye-prompt.md`, it does not load project files, project instructions, skills, prompt templates, tools, or the full session history. Other extensions and provider-side processing are outside SLYE's control.

## Evidence

Read the [MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md) for the complete behavior and the [benchmark results](backlog/docs/specs/doc-4%20-%20SLYE-benchmark-results.md) for methodology, costs, and limitations.

## Development

Requires Node 24+ and either Pi or OMP.

```sh
npm ci
npm run check
npm run check:omp-load
npm pack --dry-run --json
pi -e .
omp -e ./src/omp.ts
```

`check:omp-load` loads SLYE in the installed OMP without a model call and skips when OMP is absent. The final two commands load the clone for local testing in Pi and OMP. Do not submit a prompt when you only need to check that the extension loads.
