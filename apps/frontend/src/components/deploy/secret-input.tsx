import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

function SecretInput({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        type={revealed ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className={cn("font-mono text-code", !revealed && "tracking-widest")}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={revealed ? "Hide value" : "Show value"}
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { SecretInput };
