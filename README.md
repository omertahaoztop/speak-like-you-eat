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

Use the current Pi release; older Pi versions are not supported.

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

- **ELI5** (active by default): rebuilds the answer for a reader who wants the point fast. It starts with the conclusion and what you need to do, then lists what was done, the steps, the key facts, and the open decisions, under headings when the answer has more than one part, keeping tables as tables, in plain spoken words without corporate jargon (technical terms stay). The prompt asks it to stay no longer than the original: wordy answers shrink, while short, plain ones are mostly reorganized at about their length. Models still sometimes run a little longer, especially when they split a dense paragraph into steps. The prompt asks it to keep conclusions, actions, and decisions while cutting redundant evidence and secondary detail; see the [Built-in ELI5 prompt](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md#built-in-eli5-prompt-pi) for the full preservation policy. Model output can vary. Adapted from the [unslop](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md) and [i-have-adhd](https://github.com/ayghri/i-have-adhd) skills.
- **Light**: the lighter rewrite SLYE has always made, close to the original wording, or your custom prompt's output.

Click a tab in fullscreen mode, or press `ctrl+\` in any mode, to switch. The choice applies to every card and resets when Pi restarts. On Pi each rewrite makes two provider requests, in parallel, so it costs about twice as much as one version. OMP shows only the Light version, without tabs.

On both Pi and OMP, the name of the model that made the card appears small on the right of its heading line, when the window is wide enough.

SLYE automatically uses the selected model's lowest supported thinking level. Automatic rewriting requires a normally completed final response with at least 200 non-whitespace prose characters outside fenced code. Manual `/slye` uses the same normal-completion, prose, and no-tool-call requirements, but has no 200-character minimum.

### Custom system prompt

To replace the built-in Light prompt with your own `slye-prompt.md`, follow [Customize the SLYE system prompt](backlog/docs/runbooks/doc-6%20-%20Customize-the-SLYE-system-prompt.md).

### Recommended models

Use cheap-ish, fast models; SLYE sets reasoning for you. Both Pi tabs use the same model. These rankings are observations from a small manual trial on real and synthetic examples, not guarantees. In order:

1. **Claude Haiku 5.5** - the best ELI5: it restructured well, dropped jargon, and preserved code examples most reliably. On Light it stayed faithful and preserved code, though some jargon survived.
2. **GPT-6 Luna** - removed jargon best on Light and gave a good, short ELI5, but in both tabs sometimes dropped code examples or code comments.
3. **DeepSeek V4.1 Flash** - the fastest. Light stayed faithful to the original but kept much of the jargon; ELI5 sometimes kept jargon and dropped code examples.
4. **Gemma 4 31B** - plain and short in both tabs, but cut content and sometimes shifted the meaning; in ELI5 it dropped most code blocks and occasionally added a question.

The scored [benchmark](backlog/docs/specs/doc-4%20-%20SLYE-benchmark-results.md) is historical evidence for an earlier version of the Light prompt, not a current ranking.

## What SLYE guarantees

- The original response stays visible and unchanged. The display-only card never enters LLM context.
- SLYE's built-in Light prompt tells the model to preserve the target response's language and intentional language mix rather than translate it. The ELI5 prompt keeps the response's main language but may reorder it, change its Markdown structure, shorten it, and cut secondary detail or logs that only show how something was found. A custom prompt replaces those instructions for the Light version only. The ELI5 prompt replaces business jargon in other languages, such as English buzzwords in an Italian answer, with plain words in the answer's language.
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
