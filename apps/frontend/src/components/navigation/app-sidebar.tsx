"use client";

import {
  CardsIcon,
  CaretRightIcon,
  CheckerboardIcon,
  GameControllerIcon,
  GithubLogoIcon,
  JoystickIcon,
  LinkSimpleIcon,
  PuzzlePieceIcon,
  UsersIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAME_CATEGORIES, getVisibleGames } from "@/features/games-list";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import type { GameCategoryId } from "@/features/games-list";

const categoryIcons: Record<
  GameCategoryId,
  React.ComponentType<{ className?: string }>
> = {
  "2d-platformer": JoystickIcon,
  "board-games": CheckerboardIcon,
  "card-games": CardsIcon,
  multiplayer: UsersIcon,
  "word-puzzle": PuzzlePieceIcon,
};

export const AppSidebar = ({
  ...properties
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible="icon" {...properties}>
      <SidebarHeader className="border-sidebar-border flex h-14 shrink-0 justify-center border-b px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="hover:border-sidebar-border h-10 border border-transparent"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center">
                <GameControllerIcon className="size-4" weight="fill" />
              </div>
              <div className="flex flex-col justify-center gap-0 leading-none">
                <span className="text-sidebar-foreground/70 text-[10px] leading-none font-light tracking-widest uppercase">
                  DevHaven
                </span>
                <span className="font-heading text-xl leading-none font-semibold tracking-[-0.025em] uppercase">
                  Games
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <a
                  href="https://github.com/BlankRiser"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              tooltip="BlankRiser"
              className="text-xs tracking-wider uppercase"
            >
              <LinkSimpleIcon />
              <span>BlankRiser</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <a
                  href="https://github.com/BlankRiser/devhaven-games"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              tooltip="Star on GitHub"
              className="text-xs tracking-wider uppercase"
            >
              <GithubLogoIcon />
              <span>Star on GitHub</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

const NavMain = () => {
  const pathname = usePathname();
  const visibleGames = getVisibleGames();

  const categoryGroups = GAME_CATEGORIES.map((category) => {
    return {
      ...category,
      icon: categoryIcons[category.id],
      items: visibleGames.filter((game) => {
        return category.id === "multiplayer"
          ? game.supportsMultiplayer === true || game.category === "multiplayer"
          : game.category === category.id;
      }),
    };
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Categories</SidebarGroupLabel>
      <SidebarMenu>
        {categoryGroups.map((group) => {
          const Icon = group.icon;
          const hasGames = group.items.length > 0;

          return (
            <Collapsible
              key={group.id}
              defaultOpen={hasGames}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip={group.label}
                    className="text-xs font-medium tracking-wider uppercase"
                  />
                }
              >
                <Icon />
                <span>{group.label}</span>
                <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {hasGames ? (
                    group.items.map((subItem) => {
                      const isActive = pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.slug}>
                          <SidebarMenuSubButton
                            isActive={isActive}
                            render={<Link href={subItem.url} />}
                            className="text-xs tracking-wider uppercase"
                          >
                            <span>{subItem.label}</span>
                            {subItem.supportsMultiplayer === true ? (
                              <span className="ml-auto flex items-center text-emerald-500">
                                <UsersThreeIcon
                                  className="size-3.5 shrink-0"
                                  weight="fill"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  Multiplayer Supported
                                </span>
                              </span>
                            ) : null}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })
                  ) : (
                    <SidebarMenuSubItem>
                      <span className="text-sidebar-foreground/50 block px-3 py-1 text-[10px] font-light tracking-wider uppercase">
                        Coming Soon
                      </span>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};
