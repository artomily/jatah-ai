"use client";

import { useState } from "react";
import { formatMoneyExact } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 25];

/** Mounted once at the app root — opened globally via `setTopUpOpen`. */
export function TopUpDialog() {
  const open = useAppStore((s) => s.topUpOpen);
  const setOpen = useAppStore((s) => s.setTopUpOpen);
  const topUp = useAppStore((s) => s.topUp);
  const [selected, setSelected] = useState<number | "custom">(10);
  const [custom, setCustom] = useState("");

  const amount = selected === "custom" ? Number(custom) : selected;
  const valid = Number.isFinite(amount) && amount > 0 && amount <= 500;

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSelected(10);
      setCustom("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up wallet</DialogTitle>
          <DialogDescription>Add funds to cover usage runs and passes.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Top-up amount">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={selected === preset}
                onClick={() => setSelected(preset)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected === preset ? "border-brand bg-brand-soft" : "hover:bg-muted/60",
                )}
              >
                {formatMoneyExact(preset)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-amount">Custom amount</Label>
            <Input
              id="custom-amount"
              type="number"
              inputMode="decimal"
              min={1}
              max={500}
              step="0.01"
              placeholder="$0.00"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected("custom");
              }}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              topUp(amount);
              handleClose(false);
            }}
          >
            Add {valid ? formatMoneyExact(amount) : "funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
