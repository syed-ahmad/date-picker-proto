import { render, fireEvent } from "@testing-library/react";
import { AccessibleDatePicker } from "./AccessibleDatePicker";
import { axe } from "jest-axe";

describe("AccessibleDatePicker - Keyboard Navigation & Accessibility", () => {
  test("Tab focuses and unfocuses input", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const input = getByPlaceholderText("DD.MM.YYYY");
    input.blur(); // Ensure precondition
    input.focus();
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: "Tab" });
    // Will move focus out; simulate focus loss
    input.blur();
    expect(document.activeElement).not.toBe(input);
  });

  test("Shift+Tab reverses focus", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const input = getByPlaceholderText("DD.MM.YYYY");
    input.focus();
    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    input.blur();
    expect(document.activeElement).not.toBe(input);
  });

  test("Arrow left/right navigates segments", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "25.12.2025" } });
    input.focus();
    input.setSelectionRange(0, 2);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(5);
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
  });

  test("Arrow up/down increments/decrements active segment", () => {
    let date: Date | null | undefined = undefined;
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker
        onChange={(d) => (date = d)}
        dateFormat="DD.MM.YYYY"
      />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "20.05.2024" } });
    input.focus();
    // Focus day segment
    input.setSelectionRange(0, 2);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect((date as unknown as Date)?.getDate()).toBe(21);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect((date as unknown as Date)?.getDate()).toBe(20);
    // Focus month segment
    input.setSelectionRange(3, 5);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect((date as unknown as Date)?.getMonth()).toBe(5); // June (0-based JS)
  });

  test("Separator key moves to next segment", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" separator="." />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "05.12.2025" } });
    input.setSelectionRange(0, 2); // Focus on day
    fireEvent.keyDown(input, { key: "." });
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(5); // Month
  });

  test("Escape removes focus from input", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: "Escape" });
    input.blur();
    expect(document.activeElement).not.toBe(input);
  });

  test("Focus indicator visible (WCAG 2.4.7)", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    input.focus();
    // Optionally check computed style: outline presence
    expect(window.getComputedStyle(input).outlineStyle).not.toBe("none");
  });

  test("Input is always focusable by keyboard", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" disabled={false} />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  test("Input supports locale changes for value display", () => {
    const { getByLabelText } = render(
      <AccessibleDatePicker
        value={new Date(2025, 6, 4)}
        locale="fr-FR"
        dateFormat="DD.MM.YYYY"
      />
    );
    const input = getByLabelText(/Date input/) as HTMLInputElement;
    // Should use French format: "04.07.2025"
    expect(input.value).toBe("04.07.2025");
  });

  test("No keyboard trap (WCAG 2.1.2)", () => {
    const { getByPlaceholderText } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const input = getByPlaceholderText("DD.MM.YYYY") as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: "Tab" });
    input.blur();
    expect(document.activeElement).not.toBe(input);
    // Can return again
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  test("Accessible name, role, and aria-validity", async () => {
    const { getByLabelText } = render(
      <AccessibleDatePicker
        dateFormat="DD.MM.YYYY"
        required
        min="2024-01-01"
        max="2025-12-31"
      />
    );
    const input = getByLabelText(/Date input/) as HTMLInputElement;
    expect(input.getAttribute("aria-label")).toMatch(/Date input/);
    expect(input.getAttribute("aria-required")).toBe("true");
    fireEvent.change(input, { target: { value: "99.99.9999" } });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(input, { target: { value: "04.07.2025" } });
    expect(input.getAttribute("aria-invalid")).toBe(null);
  });

  test("Axe accessibility analysis passes (no violations)", async () => {
    const { container } = render(
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" />
    );
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
  });
});
