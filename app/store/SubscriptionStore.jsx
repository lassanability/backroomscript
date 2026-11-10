import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useSubscriptionStore = create((set, get) => ({
  currentSubscription: null,
  subscriptionLoading: false,
  paymentLoading: false,
  verifyingPayment: false,
  allSubscriptions: [],
  allSubscriptionsLoading: false,

  tiers: {
    starter: {
      id: "starter",
      name: "Foundation",
      price: 0, 
      currency: "KSh",
      description: "Start learning for free and begin your path to certification",
      features: [
        "Email support (24h response)",
        "Access to 1 lesson per day"
      ],
      limits: {
        templatesPerDay: 1,
        totalTemplates: 15,
        bookmarks: false,
        previousAccess: false,
        coaching: false,
        responseTime: "24 hours"
      }
    },
    pro: {
      id: "pro",
      name: "Certificate",
      price: null, 
      currency: "KSh",
      description: "Unlock the full course and get on the path to job placement",
      features: [
        "Everything in Foundation",
        "20+ premium lessons",
        "Bookmark your favourite lessons",
        "Access previous lessons",
        "WhatsApp community access",
        "Certification preparation",
        "Job access through your profile",
        "Priority support (12h response)",
      ],
      limits: {
        templatesPerDay: "unlimited",
        totalTemplates: 50,
        bookmarks: true,
        previousAccess: true,
        coaching: false,
        responseTime: "12 hours"
      }
    },
    elite: {
      id: "elite",
      name: "Career",
      price: null, 
      currency: "KSh",
      description: "Complete training with mentorship and priority job access",
      features: [
        "Everything in Certificate",
        "Unlimited lessons in every course",
        "Monthly and lifetime content updates",
        "Direct WhatsApp support",
        "1-on-1 mentorship session (60min)",
        "Priority access to jobs from companies that hire through us",
      ],
      limits: {
        templatesPerDay: "unlimited",
        totalTemplates: "unlimited",
        bookmarks: true,
        previousAccess: true,
        coaching: true,
        responseTime: "2 hours"
      }
    }
  },
  pricingLoaded: false,
  pricingFetching: false,
  billing: "monthly",
  provider: null,

  setBilling: (billing) => set({ billing }),

  // Same tier on a different billing period is a switch, not the current plan.
  isCurrentPlan: (tierId) => {
    const { currentTier } = useAuthStore.getState();
    const { provider, billing, currentSubscription } = get();
    if (currentTier !== tierId) return false;
    if (provider !== "whop" || tierId === "starter") return true;
    return (currentSubscription?.interval ?? "monthly") === billing;
  },

  getSubscription: async () => {
    try {
      set({ subscriptionLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions/me`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          currentSubscription: data.data.subscription,
          subscriptionLoading: false,
        });

        useAuthStore.getState().updateUser({
          currentTier: data.data.currentTier
        });
        
        return { success: true, data: data.data };
      }
      set({ subscriptionLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get subscription error:", error);
      set({ subscriptionLoading: false });
      return { success: false, message: "Failed to fetch subscription" };
    }
  },

  initializePayment: async (tier) => {
    try {
      set({ paymentLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ tier, interval: get().billing }),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ paymentLoading: false });
        return {
          success: true,
          data: data.data
        };
      }
      set({ paymentLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Initialize payment error:", error);
      set({ paymentLoading: false });
      return { success: false, message: "Failed to initialize payment" };
    }
  },

  chargeWithSavedCard: async (tier, cardId) => {
    try {
      set({ paymentLoading: true });
      const { getAuthHeader } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/subscriptions/charge-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ tier, cardId }),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ paymentLoading: false });

        if (data.data.requiresAction) {
          return {
            success: true,
            requiresAction: true,
            data: data.data,
          };
        }

        set({ currentSubscription: data.data.subscription });

        useAuthStore.getState().updateUser({
          currentTier: data.data.tier
        });

        return {
          success: true,
          data: data.data,
          message: "Payment successful! Welcome to your new tier!"
        };
      }
      set({ paymentLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Charge with saved card error:", error);
      set({ paymentLoading: false });
      return { success: false, message: "Failed to charge card" };
    }
  },

  verifyPayment: async (reference) => {
    try {
      set({ verifyingPayment: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions/verify/${reference}`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ 
          verifyingPayment: false,
          currentSubscription: data.data.subscription,
        });

        useAuthStore.getState().updateUser({
          currentTier: data.data.tier
        });
        
        return { 
          success: true, 
          data: data.data,
          message: "Payment verified successfully! Welcome to your new tier!" 
        };
      }
      set({ verifyingPayment: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Verify payment error:", error);
      set({ verifyingPayment: false });
      return { success: false, message: "Failed to verify payment" };
    }
  },

  getTierInfo: (tier) => {
    const { tiers } = get();
    return tiers[tier] || tiers.starter;
  },

  getAllTiers: () => {
    const { tiers } = get();
    return Object.values(tiers);
  },

  canAccessTier: (requiredTier) => {
    const { currentTier } = useAuthStore.getState();
    const tierHierarchy = { starter: 0, pro: 1, elite: 2 };
    return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
  },

  getTierLevel: (tier) => {
    const tierHierarchy = { starter: 0, pro: 1, elite: 2 };
    return tierHierarchy[tier] || 0;
  },

  fetchPricing: async () => {
    try {
      const response = await fetch(`${SERVER_API}/subscriptions/pricing`, {
        cache: 'no-store', // Ensure fresh data on every request
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        set({ pricingError: `HTTP ${response.status}` });
        return { success: false, message: `HTTP ${response.status}` };
      }

      const data = await response.json();

      if (data.status === "success") {
        const { pricing } = data.data;

        set((state) => ({
          tiers: {
            ...state.tiers,
            starter: { ...state.tiers.starter, currency: pricing.starter?.currency ?? state.tiers.starter.currency },
            pro: { ...state.tiers.pro, price: pricing.pro.price, yearlyPrice: pricing.pro.yearlyPrice ?? null, currency: pricing.pro.currency ?? state.tiers.pro.currency },
            elite: { ...state.tiers.elite, price: pricing.elite.price, yearlyPrice: pricing.elite.yearlyPrice ?? null, currency: pricing.elite.currency ?? state.tiers.elite.currency }
          },
          provider: pricing.provider ?? "paystack",
          pricingLoaded: true,
          pricingError: null
        }));

        return { success: true, data: pricing };
      }

      set({ pricingError: data.message });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Fetch pricing error:", error);
      set({ pricingError: error.message });
      return { success: false, message: "Failed to fetch pricing" };
    }
  },

  initializePricing: async (retries = 3) => {
    const { pricingLoaded } = get();

    if (pricingLoaded) {
      return { success: true };
    }

    for (let i = 0; i < retries; i++) {
      const result = await get().fetchPricing();

      if (result.success) {
        return result;
      }

      // Wait before retry (exponential backoff)
      if (i < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, message: "Failed to load pricing after retries" };
  },

  getAllSubscriptions: async () => {
    try {
      set({ allSubscriptionsLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions-admin/all`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          allSubscriptions: data.data.subscriptions,
          allSubscriptionsLoading: false,
        });
        return { success: true, data: data.data.subscriptions };
      }
      set({ allSubscriptionsLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get all subscriptions error:", error);
      set({ allSubscriptionsLoading: false });
      return { success: false, message: "Failed to fetch subscriptions" };
    }
  },

  grantSubscription: async (userId, tier, duration) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions-admin/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ userId, tier, duration }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllSubscriptions();
        return { success: true, message: "Subscription granted successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Grant subscription error:", error);
      return { success: false, message: "Failed to grant subscription" };
    }
  },
}));