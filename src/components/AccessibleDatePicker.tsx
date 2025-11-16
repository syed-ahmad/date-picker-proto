import React, { useRef, useState, useEffect } from "react";

type DatePickerProps = {
  value?: string | Date;
  onChange?: (date: Date | null) => void;
  dateFormat?: string;
  separator?: string;
  locale?: string;
  min?: string | Date;
  max?: string | Date;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
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

function formatDate(
  date: Date | null,
  format: string,
  locale: string,
  separator: string
) {
  if (!date) return "";
  const order = parseFormat(format, separator);
  const dt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  // Map parts based on order
  const parts = dt.split(/[^\d]+/);
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
}) => {
  const [inputVal, setInputVal] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);
  const formatIndices = getSegmentIndices(dateFormat, separator);
  const order = parseFormat(dateFormat, separator);

  useEffect(() => {
    if (value) {
      const date = typeof value === "string" ? new Date(value) : value;
      setInputVal(formatDate(date, dateFormat, locale, separator));
    } else {
      setInputVal("");
    }
  }, [value, dateFormat, separator, locale]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    const parsed = parseDateStr(v, dateFormat, separator);
    if (
      parsed &&
      (!min || parsed >= new Date(min)) &&
      (!max || parsed <= new Date(max))
    ) {
      onChange?.(parsed);
    } else {
      onChange?.(null);
    }
  };

  const formatValueForAria = inputVal || (placeholder ?? dateFormat);
  const isInvalid = inputVal && !parseDateStr(inputVal, dateFormat, separator);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const pos = inputRef.current?.selectionStart ?? 0;
    const currentSeg = order.findIndex((seg) => {
      const [s, f] = formatIndices[seg];
      return pos >= s && pos <= f;
    });
    if (currentSeg < 0) return;

    if (e.key === "ArrowLeft" && currentSeg > 0) {
      e.preventDefault();
      const seg = order[currentSeg - 1];
      const [start, end] = formatIndices[seg];
      inputRef.current!.setSelectionRange(start, end);
    }
    if (e.key === "ArrowRight" && currentSeg < order.length - 1) {
      e.preventDefault();
      const seg = order[currentSeg + 1];
      const [start, end] = formatIndices[seg];
      inputRef.current!.setSelectionRange(start, end);
    }
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      let date = parseDateStr(inputVal, dateFormat, separator);
      if (!date) return;
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      if (order[currentSeg] === "DD") day += e.key === "ArrowUp" ? 1 : -1;
      if (order[currentSeg] === "MM") month += e.key === "ArrowUp" ? 1 : -1;
      if (order[currentSeg] === "YYYY") year += e.key === "ArrowUp" ? 1 : -1;

      date.setDate(day);
      date.setMonth(month - 1);
      date.setFullYear(year);

      setInputVal(formatDate(date, dateFormat, locale, separator));
      onChange?.(date);
      setTimeout(() => {
        const [start, end] = formatIndices[order[currentSeg]];
        inputRef.current?.setSelectionRange(start, end);
      }, 0);
      e.preventDefault();
    }
    if (e.key === separator) {
      e.preventDefault();
      if (currentSeg < order.length - 1) {
        const nextSeg = order[currentSeg + 1];
        const [start, end] = formatIndices[nextSeg];
        inputRef.current?.setSelectionRange(start, end);
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={inputVal}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder ?? dateFormat}
      aria-label={`Date input in format ${dateFormat}`}
      aria-required={required}
      aria-invalid={isInvalid}
      disabled={disabled}
      autoComplete="off"
      //   style={{ width: "11em" }}
      title="Date input"
    />
  );
};
