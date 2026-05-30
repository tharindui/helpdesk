import { render } from "@testing-library/react";
import { AssigneeCombobox } from "../AssigneeCombobox";
import type { Assignee } from "@/pages/users/usersApi";

type Props = {
  assignees?: Assignee[];
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

export function renderAssigneeCombobox({ assignees = [], value = null, onChange, disabled }: Props) {
  return render(
    <AssigneeCombobox
      assignees={assignees}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
