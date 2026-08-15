"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BudgetFormSheet } from "@/components/budgets";
import { CategoryFormSheet } from "@/components/categories/category-form-dialog";
import { NewTransaction } from "@/components/dashboard/new-transaction/new-transaction";
import { GoalFormSheet } from "@/components/goals";
import { Icon } from "@/components/shared/icon";
import { useRouteProgress } from "@/components/shared/route-progress";
import { SubscriptionFormSheet } from "@/components/subscriptions/subscription-form-dialog";
import { useBudgetApi } from "@/hooks/api/useBudgetApi";
import { useCategoryApi } from "@/hooks/api/useCategoryApi";
import { useGoalApi } from "@/hooks/api/useGoalApi";
import { useSubscriptionApi } from "@/hooks/api/useSubscriptionApi";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  ArrowUpDown,
  Plus,
  Repeat2,
  Tag,
  Target,
  Wallet,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { CreateBudgetInput, UpdateBudgetInput } from "@/types/Budget";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/Category";
import type { CreateGoalInput, UpdateGoalInput } from "@/types/Goal";
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "@/types/Subscription";

interface AddAction {
  id: AddActionId;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
}

type AddActionId =
  | "transaction"
  | "budget"
  | "goal"
  | "subscription"
  | "category";

/**
 * Mobile quick-create speed dial. It stays above app content and navigation;
 * the selected entity form opens in a bottom sheet without leaving the page.
 */
export function PwaFab() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (!isMobile) return null;
  if (pathname !== "/dashboard") return null;

  return <PwaFabContent />;
}

function PwaFabContent() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { isNavigating } = useRouteProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<AddActionId | null>(null);
  const open = menuOpen || activeAction !== null;
  const { hidden: fabHidden } = useHideOnScroll({
    suppress: menuOpen || activeAction !== null,
  });
  const hideFab = fabHidden && !menuOpen && activeAction === null;

  const { create: createBudget, isCreating: isCreatingBudget } = useBudgetApi();
  const {
    categories,
    create: createCategory,
    isCreating: isCreatingCategory,
  } = useCategoryApi();
  const { create: createGoal, isCreating: isCreatingGoal } = useGoalApi();
  const { create: createSubscription, isCreating: isCreatingSubscription } =
    useSubscriptionApi();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActiveAction(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // During in-flight navigation the page is about to swap; close any open
  // menu/form and let the whole FAB fade out so it never lingers mid-swap.
  useEffect(() => {
    if (isNavigating) {
      setMenuOpen(false);
      setActiveAction(null);
    }
  }, [isNavigating]);

  const closeForm = () => {
    setMenuOpen(false);
    setActiveAction(null);
  };

  const actions: AddAction[] = [
    {
      id: "transaction",
      label: t("common.transaction"),
      icon: ArrowUpDown,
      iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      id: "budget",
      label: t("common.budget"),
      icon: Wallet,
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      id: "goal",
      label: t("common.goal"),
      icon: Target,
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "subscription",
      label: t("common.subscription"),
      icon: Repeat2,
      iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      id: "category",
      label: t("common.category"),
      icon: Tag,
      iconClassName: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  const handleBudgetSubmit = async (
    data: CreateBudgetInput | UpdateBudgetInput,
  ) => {
    await createBudget(data as CreateBudgetInput);
    closeForm();
  };

  const handleCategorySubmit = async (
    data: CreateCategoryInput | UpdateCategoryInput,
  ) => {
    await createCategory(data as CreateCategoryInput);
    closeForm();
  };

  const handleGoalSubmit = async (data: CreateGoalInput | UpdateGoalInput) => {
    await createGoal(data as CreateGoalInput);
    closeForm();
  };

  const handleSubscriptionSubmit = async (
    data: CreateSubscriptionInput | UpdateSubscriptionInput,
  ) => {
    await createSubscription(data as CreateSubscriptionInput);
    closeForm();
  };

  const buttonLabel = open ? t("common.close") : t("nav.addNew");

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          opacity: isNavigating ? 0 : 1,
          y: hideFab ? 140 : 0,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 38 }
        }
        className={cn(
          "fixed right-4 z-[45] flex flex-col items-end",
          "bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)]",
          isNavigating && "pointer-events-none",
        )}
      >
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
              className="mb-3 flex flex-col-reverse items-end gap-2"
              role="menu"
              aria-label={t("nav.addNew")}
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 10, y: 8, scale: 0.7 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, y: 8, scale: 0.7 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 520,
                          damping: 34,
                          mass: 0.65,
                          delay: index * 0.045,
                        }
                  }
                >
                  <button
                    type="button"
                    role="menuitem"
                    aria-label={action.label}
                    title={action.label}
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveAction(action.id);
                    }}
                    className="group flex min-h-11 max-w-[calc(100vw-2rem)] items-center justify-end gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="max-w-[calc(100vw-5rem)] truncate rounded-xl border border-border/60 bg-background/95 px-3 py-2 text-sm font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur-sm">
                      {action.label}
                    </span>
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full border border-background/80 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95",
                        action.iconClassName,
                      )}
                    >
                      <Icon icon={action.icon} className="size-5" />
                    </span>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={buttonLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          title={buttonLabel}
          onClick={() => {
            if (activeAction) {
              closeForm();
            } else {
              setMenuOpen((current) => !current);
            }
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 24,
            delay: 0.3,
          }}
          className={cn(
            "group relative flex size-14 items-center justify-center rounded-full",
            open
              ? "bg-gradient-to-br from-destructive via-destructive to-destructive/80 text-destructive-foreground shadow-lg shadow-destructive/30 hover:shadow-xl hover:shadow-destructive/35 hover:ring-destructive/15"
              : "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/35 hover:ring-primary/15",
            "ring-4 ring-background/80 transition-[transform,box-shadow] duration-200",
            open
              ? "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/40"
              : "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
            "active:scale-95",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-1 rounded-full border",
              open
                ? "border-destructive-foreground/20"
                : "border-primary-foreground/20",
            )}
          />
          <motion.span
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.25, type: "spring", stiffness: 260 }}
            className="relative flex size-8 items-center justify-center rounded-full bg-primary-foreground/10"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "add"}
                initial={{ opacity: 0, scale: 0.5, rotate: open ? -45 : 45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: open ? 45 : -45 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                className="flex items-center justify-center"
              >
                <Icon icon={open ? X : Plus} className="size-6" />
              </motion.span>
            </AnimatePresence>
          </motion.span>
        </motion.button>
      </motion.div>

      <NewTransaction
        openInSheet
        hideTrigger
        controlledOpen={activeAction === "transaction"}
        onOpenChange={(next) => setActiveAction(next ? "transaction" : null)}
      />

      <BudgetFormSheet
        open={activeAction === "budget"}
        onOpenChange={(next) => !next && closeForm()}
        budget={null}
        onSubmit={handleBudgetSubmit}
        isSubmitting={isCreatingBudget}
        categories={categories}
      />

      <GoalFormSheet
        open={activeAction === "goal"}
        onOpenChange={(next) => !next && closeForm()}
        editing={null}
        onSubmit={handleGoalSubmit}
        isSubmitting={isCreatingGoal}
      />

      <SubscriptionFormSheet
        open={activeAction === "subscription"}
        onOpenChange={(next) => !next && closeForm()}
        subscription={null}
        onSubmit={handleSubscriptionSubmit}
        isSubmitting={isCreatingSubscription}
      />

      <CategoryFormSheet
        open={activeAction === "category"}
        onOpenChange={(next) => !next && closeForm()}
        category={null}
        onSubmit={handleCategorySubmit}
        isSubmitting={isCreatingCategory}
      />
    </>
  );
}
