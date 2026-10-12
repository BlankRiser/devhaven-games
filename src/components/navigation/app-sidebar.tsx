'use client';

import {
  CardsIcon,
  CaretRightIcon,
  CheckerboardIcon,
  GameControllerIcon,
  GithubLogoIcon,
  JoystickIcon,
  LinkSimpleIcon,
  PuzzlePieceIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { GAME_CATEGORIES, getVisibleGames, type GameCategoryId } from '@/features/games-list';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

const CATEGORY_ICONS: Record<GameCategoryId, React.ComponentType<{ className?: string }>> = {
  'board-games': CheckerboardIcon,
  '2d-platformer': JoystickIcon,
  'word-puzzle': PuzzlePieceIcon,
  'card-games': CardsIcon,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="border border-transparent hover:border-sidebar-border">
              <div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                <GameControllerIcon className="size-4" weight="fill" />
              </div>
              <div className="flex flex-col gap-0 leading-none">
                <span className="text-[10px] font-light tracking-widest text-sidebar-foreground/70 uppercase">
                  DevHaven
                </span>
                <span className="font-heading text-2xl leading-none font-semibold tracking-[-0.025em] uppercase">
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
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="http://github.com/BlankRiser" target="_blank" rel="noreferrer" />}
              tooltip="BlankRiser"
              className="text-xs tracking-wider uppercase">
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
              className="text-xs tracking-wider uppercase">
              <GithubLogoIcon />
              <span>Star on GitHub</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

const NavMain = () => {
  const pathname = usePathname();
  const visibleGames = getVisibleGames();

  const categoryGroups = GAME_CATEGORIES.map((category) => ({
    ...category,
    icon: CATEGORY_ICONS[category.id],
    items: visibleGames.filter((game) => game.category === category.id),
  }));

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
              render={<SidebarMenuItem />}>
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip={group.label}
                    className="text-xs font-medium tracking-wider uppercase"
                  />
                }>
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
                            className="text-xs tracking-wider uppercase">
                            <span>{subItem.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })
                  ) : (
                    <SidebarMenuSubItem>
                      <span className="block px-3 py-1 text-[10px] font-light tracking-wider text-sidebar-foreground/50 uppercase">
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
