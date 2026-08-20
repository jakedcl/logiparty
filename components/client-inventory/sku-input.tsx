"use client";

import { useState } from "react";
import { normalizeSku } from "@/lib/inventory/sku";

type SkuInputProps = {
  name?: string;
  id?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

export function SkuInput({
  name = "sku",
  id,
  defaultValue = "",
  required,
  className,
  placeholder = "e.g. RB-TABLE-01",
}: SkuInputProps) {
  const [value, setValue] = useState(() =>
    defaultValue ? normalizeSku(defaultValue) : ""
  );

  return (
    <input
      id={id}
      name={name}
      required={required}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className={className}
      onChange={(e) => setValue(normalizeSku(e.target.value))}
    />
  );
}
