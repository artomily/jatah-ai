"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WatchDemoDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Play className="size-4" aria-hidden />
        Watch demo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Product walkthrough</DialogTitle>
            <DialogDescription>
              A 90-second tour of estimate, approval, and receipts. Demo video coming soon —
              in the meantime, explore the live product.
            </DialogDescription>
          </DialogHeader>
          <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
            Video placeholder
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
