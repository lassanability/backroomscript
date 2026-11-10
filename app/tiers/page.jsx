"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import { useSubscriptionStore } from "@/app/store/SubscriptionStore";
import { toast } from "sonner";
import PricingGrid from "@/app/components/PricingGrid";
import styles from "@/app/style/tiers.module.css";

export default function TiersPage() {
  const router = useRouter();
  const { isAuth, currentTier } = useAuthStore();

  const tiersObject = useSubscriptionStore((state) => state.tiers);
  const pricingLoaded = useSubscriptionStore((state) => state.pricingLoaded);
  const getTierLevel = useSubscriptionStore((state) => state.getTierLevel);
  const initializePayment = useSubscriptionStore((state) => state.initializePayment);
  const paymentLoading = useSubscriptionStore((state) => state.paymentLoading);

  const tiers = useMemo(() => Object.values(tiersObject), [tiersObject]);

  const [processingTier, setProcessingTier] = useState(null);

  useEffect(() => {
    console.log("🎨 Tiers page: Pricing loaded =", pricingLoaded);
    console.log("💵 Current tier prices:", tiers.map(t => ({ id: t.id, price: t.price })));
  }, [pricingLoaded, tiers]);

  const handleSelectTier = async (tier) => {
    if (!isAuth) {
      toast.error("Please login to upgrade");
      router.push("/authentication/login");
      return;
    }

    if (tier.id === "starter") {
      toast.info("Starter tier is free and available to all users");
      return;
    }

    if (useSubscriptionStore.getState().isCurrentPlan(tier.id)) {
      toast.info(`You're already on the ${tier.name} tier`);
      return;
    }

    const currentLevel = getTierLevel(currentTier);
    const targetLevel = getTierLevel(tier.id);
    
    if (targetLevel < currentLevel) {
      toast.info("Please contact support to downgrade your plan");
      return;
    }

    setProcessingTier(tier.id);

    try {
      const result = await initializePayment(tier.id);

      if (result.success) {
        toast.success("Redirecting to payment...");
        // Payment gateway will redirect back to dashboard with verification params
        window.location.href = result.data.authorizationUrl;
      } else {
        toast.error(result.message || "Failed to initialize payment");
        setProcessingTier(null);
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Failed to process payment. Please try again.");
      setProcessingTier(null);
    }
  };

  return (
    <div className={styles.container}>
      <PricingGrid
        tiers={tiers}
        currentTier={currentTier}
        onSelectTier={handleSelectTier}
        loading={processingTier}
        variant="detailed"
        headingLevel="h1"
        showHeader={true}
        showFooter={true}
        getTierLevel={getTierLevel}
      />
    </div>
  );
}