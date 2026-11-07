import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

const toasterStyle = {
  "--normal-bg": "var(--card)",
  "--normal-text": "var(--foreground)",
  "--normal-border": "var(--border-strong)",
  "--success-bg": "var(--success-surface)",
  "--success-text": "var(--success)",
  "--success-border": "var(--success-border)",
  "--error-bg": "var(--destructive-surface)",
  "--error-text": "var(--destructive-foreground)",
  "--error-border": "var(--destructive-border)",
  "--border-radius": "var(--radius-lg)",
} as React.CSSProperties;

const toasterIcons = {
  success: <CircleCheckIcon className="size-4" />,
  info: <InfoIcon className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
  error: <OctagonXIcon className="size-4" />,
  loading: <Loader2Icon className="size-4 animate-spin" />,
};

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={toasterIcons}
      style={toasterStyle}
      toastOptions={{ classNames: { toast: "cn-toast text-label" } }}
      {...props}
    />
  );
}

export { Toaster };
