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

### Rewrite and Simple tabs (Pi)

On Pi, each card holds two versions of the rewrite, shown as tabs on its heading line:

- **Rewrite** (active by default): a full plain-language rewrite, adapted from the [unslop](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md) rules.
- **Simple**: the lighter rewrite SLYE has always made, or your custom prompt's output.

Click a tab in fullscreen mode, or press `ctrl+\` in any mode, to switch. The choice applies to every card and resets when Pi restarts. On Pi each rewrite makes two provider requests, in parallel, so it costs about twice as much as one version. Tabs need Pi 0.99 or later; older Pi hosts show only the Simple version. OMP shows only the Simple version, without tabs.

SLYE automatically uses the selected model's lowest supported thinking level. Automatic rewriting requires a normally completed final response with at least 200 non-whitespace prose characters outside fenced code. Manual `/slye` uses the same normal-completion, prose, and no-tool-call requirements, but has no 200-character minimum.

### Custom system prompt

To replace the built-in Simple prompt with your own `slye-prompt.md`, follow [Customize the SLYE system prompt](backlog/docs/runbooks/doc-6%20-%20Customize-the-SLYE-system-prompt.md).

### Recommended models

I ran a small, human-scored benchmark (me) to see how different cheap AI models would handle the "translation" part.

But long story short, use cheap-ish, fast models with low/no reasoning (SLYE already sets reasoning for you).

Models that I recommend:

- **Terra** - best overall in this benchmark but not the fastest
- **DeepSeek V4 Flash** - fast, good accuracy
- **GPT-OSS 120B** - cheapest of the three with good overall results, but more sensitive to prompt wording in this small benchmark

## What SLYE guarantees

- The original response stays visible and unchanged. The display-only card never enters LLM context.
- SLYE's built-in prompts tell the model to preserve the target response's language and intentional language mix rather than translate it. A custom prompt replaces those instructions for the Simple version only.
- Each target has at most one persistent companion card. Secondary provider requests (two on Pi 0.99 or later, one on older Pi and on OMP) have their own cost and latency and happen only for an automatically eligible response or an eligible, not-yet-completed manual target.
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
npm run check:old-pi
npm pack --dry-run --json
pi -e .
omp -e ./src/omp.ts
```

`check:omp-load` loads SLYE in the installed OMP and skips when OMP is absent; `check:old-pi` loads it in a temporary Pi 0.87.1 install. Neither makes a model call. The final two commands load the clone for local testing in Pi and OMP. Do not submit a prompt when you only need to check that the extension loads.
