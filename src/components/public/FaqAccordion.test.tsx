import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FaqAccordion from "./FaqAccordion";

const faqs = [
  { q: "First?", a: "Answer one" },
  { q: "Second?", a: "Answer two" },
  { q: "Third?", a: "Answer three" },
];

describe("FaqAccordion", () => {
  it("renders every question numbered", () => {
    render(<FaqAccordion faqs={faqs} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("keeps only one answer expanded at a time", () => {
    render(<FaqAccordion faqs={faqs} />);
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("folds extra questions behind a show more button but keeps them in the page", () => {
    render(<FaqAccordion faqs={faqs} visibleCount={1} />);
    const toggle = screen.getByRole("button", { name: /Show more questions \(2\)/ });
    expect(screen.getByText("Answer three")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /Show less/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("shows no toggle when everything is visible", () => {
    render(<FaqAccordion faqs={faqs} />);
    expect(screen.queryByRole("button", { name: /Show more/ })).not.toBeInTheDocument();
  });
});
