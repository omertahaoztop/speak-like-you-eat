import { getMarkdownTheme, type Theme } from "@earendil-works/pi-coding-agent";
// OMP maps this package to a TUI library without MouseRegion or the OKHSL
// helpers, and a named import of a missing member stops OMP from loading SLYE.
// The namespace import loads there; OMP never renders tabs (it passes tabs: false).
import * as tui from "@earendil-works/pi-tui";
import { Box, type Component, Markdown, Text, visibleWidth } from "@earendil-works/pi-tui";

const CARD_PADDING = 1;
const CARD_HEADING = "🤌 Speak like you eat";
const MIN_LABEL_GAP = 2;

export type SlyeTab = "rewrite" | "simple";

// Keep the legacy builder here so every host shares the one heading and padding.
export function buildLegacyCard(
  theme: Theme,
  display: string,
  background: (text: string) => string,
  modelName?: string,
): Box {
  const box = new Box(CARD_PADDING, CARD_PADDING, background);
  box.addChild(buildHeadingLine(theme, theme.bold(`${CARD_HEADING}:`), modelName));
  box.addChild(new Markdown(display, 0, 1, getMarkdownTheme()));
  return box;
}

export function buildTabbedCard(
  theme: Theme,
  simple: string,
  rewrite: string,
  getActiveTab: () => SlyeTab,
  selectTab: (tab: SlyeTab) => void,
  modelName?: string,
): Component {
  const rewriteBox = buildTabbedBox(theme, "rewrite", rewrite, modelName);
  const simpleBox = buildTabbedBox(theme, "simple", simple, modelName);
  const card: Component = {
    render(width) {
      return (getActiveTab() === "rewrite" ? rewriteBox : simpleBox).render(width);
    },
    invalidate() {
      rewriteBox.invalidate();
      simpleBox.invalidate();
    },
  };

  return new tui.MouseRegion(card, (event) => {
    if (event.type !== "click") {
      return undefined;
    }

    const tab = tabAt(theme, getActiveTab(), event.x, event.y);
    if (tab === undefined) {
      return undefined;
    }

    selectTab(tab);
    return { handled: true };
  });
}

export function cardBackground(theme: Theme): (text: string) => string {
  // Keep hue and lightness, so light and dark themes stay readable; Pi 1.0's default violet is too saturated.
  const { h, s, l } = tui.colorToOkhsl(theme.colors.customMessageBg);
  const color = tui.okhslColor(h, s / 2, l);
  return (text) => theme.style(text, { bg: color });
}

// Shared with OMP's plain fallback card. Without room for the label, the heading renders as before.
export function buildLabelledHeadingLine(heading: string, label: string): Component {
  const fallback = new Text(heading, 0, 0);

  return {
    render(width) {
      const remainingWidth = width - visibleWidth(heading) - visibleWidth(label);
      if (remainingWidth < MIN_LABEL_GAP) {
        return fallback.render(width);
      }

      return [`${heading}${" ".repeat(remainingWidth)}${label}`];
    },
    invalidate() {
      fallback.invalidate();
    },
  };
}

function buildTabbedBox(theme: Theme, activeTab: SlyeTab, display: string, modelName?: string): Box {
  const heading = headingParts(theme, activeTab)
    .map((part) => part.text)
    .join("");
  const box = new Box(CARD_PADDING, CARD_PADDING, cardBackground(theme));
  box.addChild(buildHeadingLine(theme, heading, modelName));
  box.addChild(new Markdown(display, 0, 1, getMarkdownTheme()));
  return box;
}

function buildHeadingLine(theme: Theme, heading: string, modelName: string | undefined): Component {
  if (modelName === undefined) {
    return new Text(heading, 0, 0);
  }

  return buildLabelledHeadingLine(heading, theme.fg("muted", modelName));
}

function tabAt(theme: Theme, activeTab: SlyeTab, x: number, y: number): SlyeTab | undefined {
  if (y !== CARD_PADDING) {
    return undefined;
  }

  let start = CARD_PADDING;
  for (const part of headingParts(theme, activeTab)) {
    const end = start + visibleWidth(part.text);
    if (part.tab !== undefined && x >= start && x < end) {
      return part.tab;
    }
    start = end;
  }

  return undefined;
}

function headingParts(theme: Theme, activeTab: SlyeTab): Array<{ text: string; tab?: SlyeTab }> {
  return [
    { text: CARD_HEADING },
    { text: "   " },
    { text: tabLabel(theme, "rewrite", activeTab), tab: "rewrite" },
    { text: "  " },
    { text: tabLabel(theme, "simple", activeTab), tab: "simple" },
  ];
}

function tabLabel(theme: Theme, tab: SlyeTab, activeTab: SlyeTab): string {
  const label = tab === "rewrite" ? "ELI5" : "Light";
  if (tab === activeTab) {
    return theme.bold(theme.fg("accent", `[ ${label} ]`));
  }

  return theme.fg("muted", label);
}
