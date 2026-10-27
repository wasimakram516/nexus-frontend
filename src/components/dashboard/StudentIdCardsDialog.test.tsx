import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { peopleService } from "@/services/people.service";
import { IdCardFace, IdCardSheets, initialsOf, type IdCard } from "./StudentIdCardViews";
import StudentIdCardsDialog from "./StudentIdCardsDialog";

vi.mock("@/services/people.service", () => ({ peopleService: { getIdCards: vi.fn() } }));

const meta = {
  documentType: "ID_CARD",
  generatedAt: "2026-10-28T00:00:00.000Z",
  institution: { id: "i1", name: "Greenfield School", logoUrl: null, branding: { primaryColorLight: null } },
  campus: { id: "c1", name: "Main Campus" },
};

const card = (overrides: Partial<IdCard> = {}): IdCard => ({
  studentId: "s1",
  name: "Ayesha Khan",
  regNo: "GUL-26-0001",
  className: "Grade 5",
  sectionName: "A",
  picture: null,
  dob: "2016-06-12",
  validUntil: "2027-03-31",
  guardianPhone: "03001234567",
  customValues: [{ label: "Blood group", value: "B+" }],
  ...overrides,
});

describe("IdCardFace", () => {
  it("shows the school, who the student is, where they study, and until when the card is good", () => {
    render(<IdCardFace card={card()} meta={meta} />);

    expect(screen.getByText("Greenfield School")).toBeInTheDocument();
    expect(screen.getByText("Main Campus")).toBeInTheDocument();
    expect(screen.getByText("Ayesha Khan")).toBeInTheDocument();
    expect(screen.getByText("GUL-26-0001")).toBeInTheDocument();
    expect(screen.getByText("Grade 5, A")).toBeInTheDocument();
    expect(screen.getByText("12 Jun 2016")).toBeInTheDocument();
    expect(screen.getByText("03001234567")).toBeInTheDocument();
    expect(screen.getByText("B+")).toBeInTheDocument();
    expect(screen.getByText("31 Mar 2027")).toBeInTheDocument();
  });

  it("shows initials instead of a photo when there is none, and the photo when there is", () => {
    const { rerender } = render(<IdCardFace card={card()} meta={meta} />);
    expect(screen.getByText("AK")).toBeInTheDocument();

    rerender(<IdCardFace card={card({ picture: "https://img.test/a.jpg" })} meta={meta} />);
    expect(screen.getByAltText("Photo of Ayesha Khan")).toHaveAttribute("src", "https://img.test/a.jpg");
    expect(screen.queryByText("AK")).not.toBeInTheDocument();
  });

  it("leaves out what the student does not have: no section, no guardian number, no end date", () => {
    render(<IdCardFace card={card({ sectionName: null, guardianPhone: null, validUntil: null, customValues: [] })} meta={meta} />);

    expect(screen.getByText("Grade 5")).toBeInTheDocument();
    expect(screen.queryByText("Guardian")).not.toBeInTheDocument();
    expect(screen.queryByText("Valid until")).not.toBeInTheDocument();
  });

  it("uses a school's own colour in the heading, and a default when it has none", () => {
    render(<IdCardFace card={card()} meta={{ ...meta, institution: { ...meta.institution, branding: { primaryColorLight: "#aa0000" } } }} />);

    expect(screen.getByTestId("id-card-header")).toHaveStyle({ backgroundColor: "#aa0000" });
  });

  it("falls back to the Nexus blue", () => {
    render(<IdCardFace card={card()} meta={meta} />);

    expect(screen.getByTestId("id-card-header")).toHaveStyle({ backgroundColor: "#1a237e" });
  });

  it("takes the first two initials of a long name", () => {
    expect(initialsOf("muhammad ali khan")).toBe("MA");
    expect(initialsOf("Cher")).toBe("C");
    expect(initialsOf("")).toBe("");
  });
});

describe("IdCardSheets", () => {
  it("puts ten cards on a page", () => {
    const cards = Array.from({ length: 23 }, (_, index) => card({ studentId: `s${index}`, name: `Student ${index}` }));
    const { container } = render(<IdCardSheets cards={cards} meta={meta} />);

    expect(screen.getAllByTestId("id-card")).toHaveLength(23);
    expect(container.querySelectorAll(".print-page")).toHaveLength(3);
  });
});

describe("StudentIdCardsDialog", () => {
  const campuses = [{ id: "c1", name: "Main" }, { id: "c2", name: "North" }];
  const classes = [{ id: "k1", name: "Grade 5" }];
  const sections = [{ id: "sec1", name: "A", classId: "k1" }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(peopleService.getIdCards).mockResolvedValue({ data: { data: { cards: [card()], printMeta: meta } } } as never);
  });

  const renderIt = (props: Partial<React.ComponentProps<typeof StudentIdCardsDialog>> = {}) =>
    render(
      <MessageProvider>
        <StudentIdCardsDialog open onClose={vi.fn()} campuses={campuses} classes={classes} sections={sections} {...props} />
      </MessageProvider>
    );

  it("asks for a class first, so a sheet is never a whole campus by accident", () => {
    renderIt();

    expect(screen.getByText("Choose a class to see its ID cards.")).toBeInTheDocument();
    expect(peopleService.getIdCards).not.toHaveBeenCalled();
  });

  it("makes the cards of the chosen class, then of one section", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(screen.getByLabelText("Class"));
    await user.click(await screen.findByRole("option", { name: "Grade 5" }));

    expect(await screen.findByText("Ayesha Khan")).toBeInTheDocument();
    expect(peopleService.getIdCards).toHaveBeenLastCalledWith({ campusId: "c1", classId: "k1" });

    await user.click(screen.getByLabelText("Section"));
    await user.click(await screen.findByRole("option", { name: "A" }));

    await waitFor(() => expect(peopleService.getIdCards).toHaveBeenLastCalledWith({ campusId: "c1", classId: "k1", sectionId: "sec1" }));
  });

  it("loads one student's card straight away, without pickers", async () => {
    renderIt({ studentId: "s1", initialCampusId: "c2" });

    expect(await screen.findByText("Ayesha Khan")).toBeInTheDocument();
    expect(peopleService.getIdCards).toHaveBeenCalledWith({ campusId: "c2", studentId: "s1" });
    expect(screen.queryByLabelText("Class")).not.toBeInTheDocument();
    expect(screen.getByText("ID card")).toBeInTheDocument();
  });

  it("says when there is nobody to make cards for", async () => {
    vi.mocked(peopleService.getIdCards).mockResolvedValue({ data: { data: { cards: [], printMeta: meta } } } as never);
    renderIt({ studentId: "s1" });

    expect(await screen.findByText("There are no students to make cards for.")).toBeInTheDocument();
  });

  it("says so when the cards could not be made", async () => {
    vi.mocked(peopleService.getIdCards).mockRejectedValue({ response: { status: 400, data: { message: "Choose a class or section: more than 500 cards cannot be made at once." } } });
    renderIt({ studentId: "s1" });

    expect(await screen.findByText("The cards could not be made.")).toBeInTheDocument();
    const toolbar = screen.getByText("ID card").closest("header");
    expect(within(toolbar as HTMLElement).getByRole("button", { name: "Print" })).toBeDisabled();
  });

  it("stays quiet while closed", () => {
    renderIt({ open: false, studentId: "s1" });

    expect(peopleService.getIdCards).not.toHaveBeenCalled();
  });
});
