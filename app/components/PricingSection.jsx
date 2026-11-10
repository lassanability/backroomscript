"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSubscriptionStore } from "@/app/store/SubscriptionStore";
import { useAuthStore } from "@/app/store/AuthStore";
import PageSection from "@/app/components/PageSection";
import PricingGrid from "@/app/components/PricingGrid";

export default function PricingSection() {
  const router = useRouter();
  const { isAuth, currentTier } = useAuthStore();

  const tiersObject = useSubscriptionStore((state) => state.tiers);
  const getTierLevel = useSubscriptionStore((state) => state.getTierLevel);
  const initializePayment = useSubscriptionStore((state) => state.initializePayment);

  const tiers = useMemo(() => Object.values(tiersObject), [tiersObject]);
  const [loadingTier, setLoadingTier] = useState(null);

  const handleSelectTier = async (tier) => {
    if (!isAuth) {
      toast.error("Please login to choose a plan");
      router.push("/authentication/login");
      return;
    }

    if (tier.id === "starter") {
      toast.info("The Foundation plan is free and available to all students!");
      return;
    }

    if (useSubscriptionStore.getState().isCurrentPlan(tier.id)) {
      toast.info(`You're already on the ${tier.name} plan!`);
      return;
    }

    if (getTierLevel(tier.id) < getTierLevel(currentTier)) {
      toast.info("Please contact support to downgrade your plan");
      return;
    }

    setLoadingTier(tier.id);
    const result = await initializePayment(tier.id);

    if (result.success) {
      toast.success("Redirecting to payment...");
      window.location.href = result.data.authorizationUrl;
    } else {
      toast.error(result.message || "Failed to initialize payment");
      setLoadingTier(null);
    }
  };

  return (
    <PageSection tone="tint">
      <PricingGrid
        tiers={tiers}
        currentTier={currentTier}
        onSelectTier={handleSelectTier}
        loading={loadingTier}
        variant="default"
        showHeader={true}
        showFooter={true}
        getTierLevel={getTierLevel}
      />
    </PageSection>
  );
}
