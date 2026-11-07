import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PackageManager } from "@/features/deployments/types";
import {
  packageManagerLabels,
  packageManagers,
} from "@/features/projects/build-settings";

const items = packageManagers.map((value) => ({
  value,
  label: packageManagerLabels[value],
}));

function PackageManagerSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: PackageManager;
  onChange: (value: PackageManager) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) {
          onChange(next);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full font-mono text-code">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              className="font-mono text-code"
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export { PackageManagerSelect };
