import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { type Assignee } from "@/pages/users/usersApi";

type Props = {
  assignees: Assignee[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

export function AssigneeCombobox({ assignees, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = assignees.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={(o) => setOpen(o)}>
      <PopoverTrigger
        disabled={disabled}
        className="inline-flex w-52 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.name ?? "Unassigned"}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0">
        <Command>
          <CommandInput placeholder="Search agents…" />
          <CommandList>
            <CommandEmpty>No agents found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="unassigned"
                onSelect={() => { onChange(null); setOpen(false); }}
                data-checked={value === null}
              >
                Unassigned
              </CommandItem>
              {assignees.map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.name}
                  onSelect={() => { onChange(a.id); setOpen(false); }}
                  data-checked={value === a.id}
                >
                  {a.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
