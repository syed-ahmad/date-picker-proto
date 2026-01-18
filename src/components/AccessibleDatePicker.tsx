import React, { useRef, useState, useEffect } from "react";

type DatePickerProps = {
  value?: string | Date;
  onChange?: (date: Date | string | null) => void;
  dateFormat?: string;
  separator?: string;
  locale?: string;
  min?: string | Date;
  max?: string | Date;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  // If true, onChange returns a locale-formatted string instead of a Date object
  returnString?: boolean;
};

function parseFormat(format: string = "DD.MM.YYYY", separator: string = ".") {
  return format.split(separator);
}

function parseDateStr(dateStr: string, format: string, separator: string) {
  const order = parseFormat(format, separator);
  const parts = dateStr.split(separator);
  if (order.length !== parts.length) return null;
  let day = 0,
    month = 0,
    year = 0;
  for (let i = 0; i < order.length; i++) {
    const code = order[i];
    const val = Number(parts[i]);
    if (code === "DD") day = val;
    if (code === "MM") month = val;
    if (code === "YYYY") year = val;
  }
  if (year && month && day) return new Date(year, month - 1, day);
  return null;
}

function formatDate(date: Date | null, format: string, separator: string) {
  if (!date) return "";
  const order = parseFormat(format, separator);
  const mapping: Record<string, string> = {};
  mapping["YYYY"] = date.getFullYear().toString();
  mapping["MM"] = ("0" + (date.getMonth() + 1)).slice(-2);
  mapping["DD"] = ("0" + date.getDate()).slice(-2);
  return order.map((seg) => mapping[seg]).join(separator);
}

function getSegmentIndices(format: string, separator: string) {
  const order = parseFormat(format, separator);
  const indices: Record<string, [number, number]> = {};
  let pos = 0;
  for (const seg of order) {
    indices[seg] = [pos, pos + seg.length];
    pos += seg.length + separator.length;
  }
  return indices;
}

export const AccessibleDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  dateFormat = "DD.MM.YYYY",
  separator = ".",
  locale = "en-US",
  min,
  max,
  placeholder,
  required = false,
  disabled = false,
  returnString = false,
}) => {
  const [rawValues, setRawValues] = useState<Record<string, string>>({
    DD: "",
    MM: "",
    YYYY: "",
  });

  const [focusedSegment, setFocusedSegment] = useState<string>("DD");
  const [caretSegment, setCaretSegment] = useState<string>("DD");

  const order = parseFormat(dateFormat, separator);
  const formatIndices = getSegmentIndices(dateFormat, separator);

  const inputRef = useRef<HTMLInputElement>(null);

  const allowedChars = new Set([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    separator,
  ]);

  // Compose displayed value merging user input and placeholder segments
  const composeDisplayValue = () => {
    return order
      .map((seg) => {
        const val = rawValues[seg];
        if (val.length === 0) return seg;
        if (seg === "YYYY") return val.padStart(4, "Y");
        return val.padStart(seg.length, "0");
      })
      .join(separator);
  };

  useEffect(() => {
    if (value) {
      const date = typeof value === "string" ? new Date(value) : value;
      setRawValues({
        DD: ("0" + date.getDate()).slice(-2),
        MM: ("0" + (date.getMonth() + 1)).slice(-2),
        YYYY: date.getFullYear().toString(),
      });
    } else {
      setRawValues({ DD: "", MM: "", YYYY: "" });
    }
  }, [value]);

  // Sync caretSegment state with focusedSegment to control caret after render
  useEffect(() => {
    setCaretSegment(focusedSegment);
  }, [focusedSegment]);

  useEffect(() => {
    if (!caretSegment) return;
    const [start, end] = formatIndices[caretSegment];
    window.requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(start, end);
    });
  }, [caretSegment, formatIndices]);

  const isValidSegment = (seg: string, val: string) => {
    if (val.length === 0) return true;
    if (!/^\d+$/.test(val)) return false;
    const num = parseInt(val, 10);
    if (seg === "DD") return num >= 1 && num <= 31;
    if (seg === "MM") return num >= 1 && num <= 12;
    if (seg === "YYYY") return val.length <= 4;
    return true;
  };

  const isSegmentComplete = (seg: string, val: string) => {
    if (seg === "YYYY") return val.length === 4;
    return val.length === seg.length;
  };

  const focusNextSegment = () => {
    const currentIndex = order.indexOf(focusedSegment);
    if (currentIndex < order.length - 1) {
      const nextSegment = order[currentIndex + 1];
      setFocusedSegment(nextSegment);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const filtered = [...val].filter((ch) => allowedChars.has(ch)).join("");
    if (filtered !== val) return;

    const parts = filtered.split(separator);
    if (parts.length > order.length) return;

    const newRaw: Record<string, string> = { ...rawValues };
    for (let i = 0; i < parts.length; i++) {
      const seg = order[i];
      const segmentVal = parts[i];

      if (!isValidSegment(seg, segmentVal)) return;
      if (
        segmentVal.length > seg.length &&
        !(seg === "YYYY" && segmentVal.length <= 4)
      )
        return;

      newRaw[seg] = segmentVal;
    }

    setRawValues(newRaw);

    const currentVal = newRaw[focusedSegment];
    if (
      isSegmentComplete(focusedSegment, currentVal) &&
      isValidSegment(focusedSegment, currentVal)
    ) {
      focusNextSegment();
    }

    // Format for onChange
    const composedDateStr = order
      .map((seg) => newRaw[seg].padStart(seg.length, seg))
      .join(separator);
    const parsedDate = parseDateStr(composedDateStr, dateFormat, separator);

    if (
      parsedDate &&
      (!min || parsedDate >= new Date(min)) &&
      (!max || parsedDate <= new Date(max))
    ) {
      if (returnString) {
        onChange?.(parsedDate.toLocaleDateString(locale));
      } else {
        onChange?.(parsedDate);
      }
    } else {
      onChange?.(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const controlKeys = new Set([
      "Backspace",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
      "Home",
      "End",
      "Enter",
      separator,
      "ArrowUp",
      "ArrowDown",
    ]);
    if (!allowedChars.has(e.key) && !controlKeys.has(e.key)) {
      e.preventDefault();
      return;
    }

    const pos = inputRef.current?.selectionStart ?? 0;
    const currentSegIndex = order.findIndex((seg) => {
      const [start, end] = formatIndices[seg];
      return pos >= start && pos <= end;
    });

    if (currentSegIndex < 0) return;

    if (e.key === "ArrowLeft" && currentSegIndex > 0) {
      e.preventDefault();
      setFocusedSegment(order[currentSegIndex - 1]);
    }
    if (e.key === "ArrowRight" && currentSegIndex < order.length - 1) {
      e.preventDefault();
      setFocusedSegment(order[currentSegIndex + 1]);
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const date = parseDateStr(
        composeDisplayValue().replace(/[A-Z]+/g, "0"),
        dateFormat,
        separator
      );
      if (!date) return;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      if (order[currentSegIndex] === "DD") day += e.key === "ArrowUp" ? 1 : -1;
      if (order[currentSegIndex] === "MM")
        month += e.key === "ArrowUp" ? 1 : -1;
      if (order[currentSegIndex] === "YYYY")
        year += e.key === "ArrowUp" ? 1 : -1;

      const newDate = new Date(year, month - 1, day);
      setRawValues({
        DD: ("0" + newDate.getDate()).slice(-2),
        MM: ("0" + (newDate.getMonth() + 1)).slice(-2),
        YYYY: newDate.getFullYear().toString(),
      });

      if (returnString) {
        onChange?.(newDate.toLocaleDateString(locale));
      } else {
        onChange?.(newDate);
      }
    }

    if (e.key === separator && currentSegIndex < order.length - 1) {
      e.preventDefault();
      setFocusedSegment(order[currentSegIndex + 1]);
    }
  };

  const handleFocus = () => {
    setFocusedSegment(focusedSegment);
  };

  const displayValue = composeDisplayValue();

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      placeholder={placeholder ?? dateFormat}
      aria-label={`Date input in format ${dateFormat}`}
      aria-required={required}
      aria-invalid={
        !!displayValue &&
        !parseDateStr(
          displayValue.replace(/[A-Z]+/g, "0"),
          dateFormat,
          separator
        )
      }
      disabled={disabled}
      autoComplete="off"
      style={{ width: "11em", caretColor: "black" }}
      title="Date input"
    />
  );
};
