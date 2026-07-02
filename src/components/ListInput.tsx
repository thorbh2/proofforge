"use client";

import { Icon } from "./ui";
import { isHttpUrl } from "@/lib/format";

interface Props {
  items: string[];
  setItems: (v: string[]) => void;
  placeholder: string;
  min?: number;
  max: number;
  url?: boolean;
  addLabel?: string;
}

export function ListInput({ items, setItems, placeholder, min = 1, max, url = false, addLabel = "Add" }: Props) {
  const set = (i: number, v: string) => setItems(items.map((x, idx) => (idx === i ? v : x)));
  const add = () => items.length < max && setItems([...items, ""]);
  const remove = (i: number) => items.length > min && setItems(items.filter((_, idx) => idx !== i));
  const dupes = url ? items.map((v, i) => v.trim() !== "" && items.findIndex((o) => o.trim() === v.trim()) !== i) : items.map(() => false);
  return (
    <div className="space-y-1.5">
      {items.map((v, i) => {
        const badUrl = url && v.trim() !== "" && !isHttpUrl(v);
        const dup = dupes[i];
        return (
          <div key={i}>
            <div className="flex items-center gap-1.5">
              <input className={`field ${badUrl || dup ? "!border-danger !ring-danger/30" : ""}`} value={v}
                onChange={(e) => set(i, e.target.value)} placeholder={placeholder} />
              {items.length > min && (
                <button type="button" onClick={() => remove(i)} aria-label="Remove"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-muted hover:border-danger hover:text-danger">
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {badUrl && <p className="mt-0.5 text-[0.625rem] text-danger">Must be a valid http(s) URL.</p>}
            {dup && !badUrl && <p className="mt-0.5 text-[0.625rem] text-danger">Duplicate URL.</p>}
          </div>
        );
      })}
      <button type="button" onClick={add} disabled={items.length >= max}
        className="text-xs font-semibold text-forge hover:text-[#1d4c3d] disabled:opacity-40">
        + {addLabel} <span className="text-muted">({items.length}/{max})</span>
      </button>
    </div>
  );
}
