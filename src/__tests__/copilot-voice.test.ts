import { describe, expect, it } from "vitest";
import {
  stripMarkdownForSpeech,
  unspokenTail,
} from "@/components/copilot/voice-utils";

describe("stripMarkdownForSpeech", () => {
  it("strips bold, italic and inline code", () => {
    expect(stripMarkdownForSpeech("There are **6** _urgent_ `open` orders")).
      toBe("There are 6 urgent open orders");
  });

  it("keeps link labels, drops urls", () => {
    expect(stripMarkdownForSpeech("See [the wall](https://x.test/w/5)")).toBe(
      "See the wall"
    );
  });

  it("flattens headings and lists", () => {
    const md = "## Summary\n- Wall 5: 2 open\n1. BER-001\n";
    expect(stripMarkdownForSpeech(md)).toBe("Summary Wall 5: 2 open BER-001");
  });

  it("skips fenced code blocks entirely", () => {
    expect(stripMarkdownForSpeech("Look:\n```sql\nSELECT 1;\n```\nDone.")).toBe(
      "Look: Done."
    );
  });

  it("collapses whitespace", () => {
    expect(stripMarkdownForSpeech("a\n\n\nb   c")).toBe("a b c");
  });
});

describe("unspokenTail", () => {
  it("returns everything when nothing was spoken", () => {
    expect(unspokenTail("Order done.", 0)).toBe("Order done.");
  });

  it("returns only the new tail after a continuation", () => {
    const before = "I need your approval.";
    const after = "I need your approval. Order BER-001 is marked as done.";
    expect(unspokenTail(after, before.length)).toBe(
      "Order BER-001 is marked as done."
    );
  });

  it("returns empty when the text did not grow", () => {
    expect(unspokenTail("Same text", "Same text".length)).toBe("");
  });
});
