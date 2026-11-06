import {
  AppWindow,
  Bell,
  ChartColumn,
  Compass,
  Component,
  Grid2x2,
  Layers,
  ListTree,
  LogIn,
  MousePointerClick,
  Palette,
  Shapes,
  SquareTerminal,
  TextCursorInput,
  Type,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/deploy/app-shell";
import { NavItem } from "@/components/deploy/nav-item";
import {
  ColorsSection,
  IconsSection,
  ShapeSection,
  TypographySection,
} from "@/pages/theme/sections/foundations";
import {
  AlertsSection,
  BadgesSection,
  ButtonsSection,
  FormControlsSection,
} from "@/pages/theme/sections/controls";
import { CardsSection } from "@/pages/theme/sections/cards";
import { ListsSection } from "@/pages/theme/sections/lists";
import { PipelineSection } from "@/pages/theme/sections/pipeline";
import { ChartsSection } from "@/pages/theme/sections/charts";
import { NavigationSection } from "@/pages/theme/sections/navigation";
import { ScreensSection } from "@/pages/theme/sections/screens";

const navigation: { id: string; label: string; icon: ReactNode }[] = [
  { id: "colors", label: "Colors", icon: <Palette /> },
  { id: "typography", label: "Typography", icon: <Type /> },
  { id: "shape", label: "Radius and spacing", icon: <Shapes /> },
  { id: "icons", label: "Logo and icons", icon: <Component /> },
  { id: "buttons", label: "Buttons", icon: <MousePointerClick /> },
  { id: "forms", label: "Form controls", icon: <TextCursorInput /> },
  { id: "badges", label: "Badges and status", icon: <Layers /> },
  { id: "alerts", label: "Alerts and banners", icon: <Bell /> },
  { id: "cards", label: "Cards and panels", icon: <Grid2x2 /> },
  { id: "lists", label: "Lists and tables", icon: <ListTree /> },
  { id: "pipeline", label: "Pipeline and logs", icon: <SquareTerminal /> },
  { id: "charts", label: "Charts", icon: <ChartColumn /> },
  { id: "navigation", label: "Navigation", icon: <Compass /> },
  { id: "screens", label: "Auth screen", icon: <LogIn /> },
];

export default function ThemePage() {
  return (
    <AppShell
      title={
        <span className="flex items-center gap-2">
          <AppWindow className="size-4 text-muted-foreground" />
          Theme
        </span>
      }
      nav={navigation.map((item, index) => (
        <NavItem key={item.id} href={`#${item.id}`} active={index === 0}>
          {item.icon}
          {item.label}
        </NavItem>
      ))}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-heading font-medium">Design system</h1>
          <p className="text-sm text-muted-foreground">
            A static reference of every color, type style, shape and component
            used across the Deploy screens.
          </p>
        </header>
        <ColorsSection />
        <TypographySection />
        <ShapeSection />
        <IconsSection />
        <ButtonsSection />
        <FormControlsSection />
        <BadgesSection />
        <AlertsSection />
        <CardsSection />
        <ListsSection />
        <PipelineSection />
        <ChartsSection />
        <NavigationSection />
        <ScreensSection />
      </div>
    </AppShell>
  );
}
