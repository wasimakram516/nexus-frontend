import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";
import { useSectionCrumb } from "@/lib/urlSection";

const items = [
  { label: "Overview", href: "/dashboard" },
  { label: "People", href: "/dashboard/people" },
  { label: "Finance", href: "/dashboard/finance" },
];

function OpenSection({ label }: { label: string }) {
  useSectionCrumb(label);
  return null;
}

describe("DashboardBreadcrumbs", () => {
  it("shows no trail on the overview or on an unknown page", () => {
    const { container, rerender } = render(<DashboardBreadcrumbs pathname="/dashboard" items={items} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<DashboardBreadcrumbs pathname="/dashboard/unknown" items={items} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Dashboard and the module, with the module as the current page", () => {
    render(<DashboardBreadcrumbs pathname="/dashboard/finance" items={items} />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Finance" })).not.toBeInTheDocument();
  });

  it("adds the open section and turns the module into a link back to its page", () => {
    render(
      <>
        <OpenSection label="Fee Vouchers" />
        <DashboardBreadcrumbs pathname="/dashboard/finance" items={items} />
      </>,
    );

    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("href", "/dashboard/finance");
    expect(screen.getByText("Fee Vouchers")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fee Vouchers" })).not.toBeInTheDocument();
  });

  it("finds the module for a page nested inside it", () => {
    render(<DashboardBreadcrumbs pathname="/dashboard/people/123" items={items} />);

    expect(screen.getByText("People")).toBeInTheDocument();
  });
});
