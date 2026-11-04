"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import { useTemplateStore } from "@/app/store/TemplateStore";
import { useSubscriptionStore } from "@/app/store/SubscriptionStore";
import { useCardStore } from "@/app/store/CardStore";
import { toast } from "sonner";

import Sidebar from "@/app/components/Sidebar";
import TemplateCard from "@/app/components/TemplateCard";
import TemplateModal from "@/app/components/TemplateModal";
import PricingGrid from "@/app/components/PricingGrid";
import CoachingSection from "@/app/components/CoachingSection";
import SuccessStorySubmission from "@/app/components/SuccessStorySubmission";
import PaymentMethods from "@/app/components/PaymentMethods";

import styles from "@/app/style/dashboard.module.css";
import cardStyles from "@/app/style/paymentMethods.module.css";

import {
  IoSparkles,
  IoChevronForward,
  IoSearch,
  IoClose,
  IoTime,
  IoBookmark,
  IoHeart,
  IoBusiness,
  IoText,
  IoPeople,
  IoCalendar,
  IoCard,
} from "react-icons/io5";


const EmptyState = ({ icon: Icon, title, description }) => (
  <div className={styles.emptyState}>
    <Icon className={styles.emptyIcon} />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const LoadingState = ({ message = "Loading..." }) => (
  <div className={styles.loadingContainer}>
    <div className={styles.loader}>
      <IoSparkles className={styles.loaderIcon} />
      <p>{message}</p>
    </div>
  </div>
);


export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuth, username, currentTier, isInitialized, initializeAuth } = useAuthStore();

  const {
    templates,
    templatesLoading,
    previousTemplates,
    previousLoading,
    bookmarkedTemplates: storeBookmarkedTemplates,
    bookmarksLoading,
    templateLimit,
    totalAvailable,
    displayedCount,
    getAllTemplates,
    getPreviousTemplates,
    getBookmarkedTemplates,
    getTemplate,
    toggleBookmark,
  } = useTemplateStore();

  const tiersObject = useSubscriptionStore((state) => state.tiers);
  const getTierInfo = useSubscriptionStore((state) => state.getTierInfo);
  const getTierLevel = useSubscriptionStore((state) => state.getTierLevel);
  const initializePayment = useSubscriptionStore((state) => state.initializePayment);
  const verifyPayment = useSubscriptionStore((state) => state.verifyPayment);
  const verifyingPayment = useSubscriptionStore((state) => state.verifyingPayment);
  const getSubscription = useSubscriptionStore((state) => state.getSubscription);
  const chargeWithSavedCard = useSubscriptionStore((state) => state.chargeWithSavedCard);
  const paymentLoading = useSubscriptionStore((state) => state.paymentLoading);

  const cards = useCardStore((state) => state.cards);
  const getCards = useCardStore((state) => state.getCards);
  const verifyCardAuthorization = useCardStore((state) => state.verifyCardAuthorization);
  const verifyingCard = useCardStore((state) => state.verifyingCard);


  const tiers = useMemo(() => Object.values(tiersObject), [tiersObject]);

  const [activeTab, setActiveTab] = useState("templates");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingToTier, setUpgradingToTier] = useState(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [pendingTier, setPendingTier] = useState(null);
  const [chargingCardId, setChargingCardId] = useState(null);

  const currentTierInfo = getTierInfo(currentTier);


  const categories = [
    { id: "all", label: "All Templates", icon: IoSparkles },
    { id: "dating", label: "Dating & Flirting", icon: IoHeart },
    { id: "business", label: "Business", icon: IoBusiness },
    { id: "social", label: "Social", icon: IoPeople },
    { id: "content", label: "Content", icon: IoText },
  ];

  const tabTitles = {
    templates: "Your Templates",
    previous: "Previous Templates",
    bookmarks: "Bookmarked Templates",
    coaching: "Coaching & Support",
    "success-stories": "Success Stories",
    "payment-methods": "Payment Methods",
  };

  const tabSubtitles = {
    templates: "Learn with our course materials and get certified to unlock jobs",
    previous: "Review templates you've accessed before",
    bookmarks: "Your saved favorite templates",
    coaching: "Get personalized guidance from our instructors",
    "success-stories": "Share how your certification and job placement changed your life",
    "payment-methods": "Save your cards securely for faster upgrades",
  };


  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuth) {
      router.push("/authentication/login");
      return;
    }

    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const status = searchParams.get("status");

    if ((reference || trxref) && !verificationComplete) {
      const paymentReference = reference || trxref;

      if (paymentReference.startsWith("BKRM-CARD-")) {
        handleCardVerification(paymentReference, status);
      } else {
        handlePaymentVerification(paymentReference, status);
      }
    } else {
      getAllTemplates();
      getPreviousTemplates();
      getBookmarkedTemplates();
      getCards();
    }
  }, [isAuth, isInitialized, router, searchParams, verificationComplete]);


  const handlePaymentVerification = async (reference, status) => {
    if (status === "cancelled") {
      toast.error("Payment was cancelled");
      router.replace("/dashboard");
      return;
    }

    toast.loading("Verifying your payment...", { id: "verify-payment" });

    try {
      const result = await verifyPayment(reference);

      if (result.success) {
        toast.success(
          result.message || "Payment verified! Welcome to your new tier! 🎉",
          { id: "verify-payment", duration: 5000 }
        );

        setVerificationComplete(true);

        await Promise.all([
          getAllTemplates(),
          getPreviousTemplates(),
          getBookmarkedTemplates(),
        ]);

        router.replace("/dashboard");
      } else {
        toast.error(result.message || "Payment verification failed", {
          id: "verify-payment",
        });
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Failed to verify payment. Please contact support.", {
        id: "verify-payment",
      });
      router.replace("/dashboard");
    }
  };

  const handleCardVerification = async (reference, status) => {
    if (status === "cancelled") {
      toast.error("Card verification was cancelled");
      router.replace("/dashboard");
      return;
    }

    toast.loading("Verifying your card...", { id: "verify-card" });

    try {
      const result = await verifyCardAuthorization(reference);

      if (result.success) {
        toast.success(
          result.message || "Card verified and saved successfully!",
          { id: "verify-card", duration: 5000 }
        );

        setVerificationComplete(true);
        setActiveTab("payment-methods");

        await Promise.all([
          getAllTemplates(),
          getPreviousTemplates(),
          getBookmarkedTemplates(),
        ]);

        router.replace("/dashboard");
      } else {
        toast.error(result.message || "Card verification failed", {
          id: "verify-card",
        });
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Card verification error:", error);
      toast.error("Failed to verify card. Please contact support.", {
        id: "verify-card",
      });
      router.replace("/dashboard");
    }
  };

  const handleTemplateClick = async (template) => {
    const tierHierarchy = { starter: 0, pro: 1, elite: 2 };
    const userTierLevel = tierHierarchy[currentTier] || 0;
    const templateTierLevel = tierHierarchy[template.tier] || 0;

    if (templateTierLevel > userTierLevel) {
      setShowUpgradeModal(true);
      return;
    }

    if (currentTier === "starter") {
      const result = await getTemplate(template._id || template.id);
      if (!result.success) {
        if (result.message?.includes("only 1 template")) {
          toast.error(result.message);
          setShowUpgradeModal(true);
        } else {
          toast.error(result.message || "Failed to access template");
        }
        return;
      }
      setSelectedTemplate(result.data);
    } else {
      setSelectedTemplate(template);
    }
  };

  const handleToggleBookmark = async (templateId) => {
    const result = await toggleBookmark(templateId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message || "Failed to update bookmark");
    }
  };

  const handleUpgrade = async (tier) => {
    if (tier.id === "starter") {
      toast.info("Starter tier is free and available to all users");
      return;
    }

    if (currentTier === tier.id) {
      toast.info(`You're already on the ${tier.name} tier`);
      return;
    }

    const currentLevel = getTierLevel(currentTier);
    const targetLevel = getTierLevel(tier.id);

    if (targetLevel < currentLevel) {
      toast.info("Please contact support to downgrade your plan");
      return;
    }

    if (cards.length > 0) {
      setPendingTier(tier);
      setShowCardPicker(true);
      return;
    }

    await startRedirectPayment(tier);
  };

  const startRedirectPayment = async (tier) => {
    setUpgradingToTier(tier.id);

    const result = await initializePayment(tier.id);
    if (result.success) {
      toast.success("Redirecting to payment...");
      window.location.href = result.data.authorizationUrl;
    } else {
      toast.error(result.message || "Failed to initialize payment");
      setUpgradingToTier(null);
    }
  };

  const handlePayWithSavedCard = async (card) => {
    if (!pendingTier) return;

    setChargingCardId(card._id);

    const result = await chargeWithSavedCard(pendingTier.id, card._id);

    if (result.success && result.requiresAction) {
      toast.info("Your bank requires verification. Redirecting...");
      window.location.href = result.data.authorizationUrl;
      return;
    }

    if (result.success) {
      toast.success(
        result.message || "Payment successful! Welcome to your new tier! 🎉",
        { duration: 5000 }
      );

      setChargingCardId(null);
      setShowCardPicker(false);
      setPendingTier(null);
      setShowUpgradeModal(false);

      await Promise.all([
        getSubscription(),
        getAllTemplates(),
        getPreviousTemplates(),
        getBookmarkedTemplates(),
      ]);
    } else {
      toast.error(result.message || "Payment failed. Please try another card.");
      setChargingCardId(null);
    }
  };

  const handlePayWithNewMethod = async () => {
    if (!pendingTier) return;

    setShowCardPicker(false);
    await startRedirectPayment(pendingTier);
    setPendingTier(null);
  };


  const filteredTemplates = (templates || []).filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  if (!isInitialized) {
    return <LoadingState message="Initializing..." />;
  }

  if (verifyingPayment) {
    return <LoadingState message="Verifying your payment..." />;
  }

  if (verifyingCard) {
    return <LoadingState message="Verifying your card..." />;
  }

  if (templatesLoading && !templates.length && !verificationComplete) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar
        username={username}
        currentTier={currentTier}
        currentTierInfo={currentTierInfo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUpgradeClick={() => setShowUpgradeModal(true)}
      />

      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerTop}>
            <div>
              <h1>{tabTitles[activeTab]}</h1>
              <p className={styles.headerSubtitle}>
                {tabSubtitles[activeTab]}
                {activeTab === "templates" &&
                  templateLimit &&
                  displayedCount > 0 && (
                    <span className={styles.limitBadge}>
                      {displayedCount} of{" "}
                      {templateLimit === "unlimited"
                        ? "unlimited"
                        : totalAvailable}{" "}
                      templates
                      {templateLimit !== "unlimited" &&
                        totalAvailable > displayedCount && (
                          <button
                            className={styles.upgradeLinkInline}
                            onClick={() => setShowUpgradeModal(true)}
                          >
                            Upgrade for more
                          </button>
                        )}
                    </span>
                  )}
              </p>
            </div>
          </div>

          {activeTab === "templates" && (
            <div className={styles.searchBar}>
              <IoSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  className={styles.clearButton}
                  onClick={() => setSearchQuery("")}
                >
                  <IoClose />
                </button>
              )}
            </div>
          )}
        </header>

        {activeTab === "templates" && (
          <div className={styles.categoriesFilter}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.categoryChip} ${
                  selectedCategory === cat.id ? styles.categoryChipActive : ""
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <cat.icon />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "templates" && (
          <div className={styles.templatesGrid}>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template._id || template.id}
                template={template}
                currentTier={currentTier}
                currentTierInfo={currentTierInfo}
                onTemplateClick={handleTemplateClick}
                onBookmarkToggle={handleToggleBookmark}
                showUpgradeModal={() => setShowUpgradeModal(true)}
              />
            ))}
          </div>
        )}

        {activeTab === "previous" && (
          <div className={styles.previousList}>
            {previousLoading ? (
              <LoadingState message="Loading previous templates..." />
            ) : (previousTemplates || []).length === 0 ? (
              <EmptyState
                icon={IoTime}
                title="No Previous Templates"
                description="Templates you access will appear here"
              />
            ) : (
              (previousTemplates || []).map((template) => (
                <div
                  key={template._id || template.id}
                  className={styles.previousItem}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className={styles.previousInfo}>
                    <h3>{template.title}</h3>
                    <div className={styles.previousMeta}>
                      <span>
                        <IoCalendar />{" "}
                        {new Date(
                          template.accessedAt || template.createdAt
                        ).toLocaleDateString()}
                      </span>
                      <span className={styles.templateCategory}>
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <IoChevronForward className={styles.previousChevron} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className={styles.templatesGrid}>
            {bookmarksLoading ? (
              <LoadingState message="Loading bookmarked templates..." />
            ) : (storeBookmarkedTemplates || []).length === 0 ? (
              <EmptyState
                icon={IoBookmark}
                title="No Bookmarked Templates"
                description="Save your favorite templates for quick access"
              />
            ) : (
              (storeBookmarkedTemplates || []).map((template) => (
                <TemplateCard
                  key={template._id || template.id}
                  template={template}
                  currentTier={currentTier}
                  currentTierInfo={currentTierInfo}
                  onTemplateClick={handleTemplateClick}
                  onBookmarkToggle={handleToggleBookmark}
                  showUpgradeModal={() => setShowUpgradeModal(true)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "coaching" && (
          <CoachingSection
            currentTier={currentTier}
            currentTierInfo={currentTierInfo}
          />
        )}

        {activeTab === "success-stories" && <SuccessStorySubmission />}

        {activeTab === "payment-methods" && <PaymentMethods />}

      </main>

      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          currentTierInfo={currentTierInfo}
          onClose={() => setSelectedTemplate(null)}
          onBookmarkToggle={handleToggleBookmark}
        />
      )}

      {showCardPicker && pendingTier && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (chargingCardId) return;
            setShowCardPicker(false);
            setPendingTier(null);
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => {
                if (chargingCardId) return;
                setShowCardPicker(false);
                setPendingTier(null);
              }}
            >
              <IoClose />
            </button>

            <div className={cardStyles.cardPicker}>
              <div className={cardStyles.cardPickerHeader}>
                <h2>Choose Payment Method</h2>
                <p>
                  Upgrading to {pendingTier.name}, {pendingTier.currency}{" "}
                  {pendingTier.price?.toLocaleString()}
                </p>
              </div>

              <div className={cardStyles.cardPickerList}>
                {cards.map((card) => (
                  <button
                    key={card._id}
                    className={cardStyles.cardPickerItem}
                    onClick={() => handlePayWithSavedCard(card)}
                    disabled={!!chargingCardId}
                  >
                    <div className={cardStyles.cardIcon}>
                      <IoCard />
                    </div>
                    <div className={cardStyles.cardPickerItemInfo}>
                      <strong>
                        {card.cardType ? card.cardType.trim() : "Card"} ••••{" "}
                        {card.last4}
                      </strong>
                      <span>
                        {chargingCardId === card._id
                          ? "Charging your card..."
                          : `Expires ${card.expMonth}/${card.expYear}${
                              card.isDefault ? " • Default" : ""
                            }`}
                      </span>
                    </div>
                    <IoChevronForward
                      className={cardStyles.cardPickerChevron}
                    />
                  </button>
                ))}
              </div>

              <div className={cardStyles.cardPickerDivider}>or</div>

              <button
                className={cardStyles.newPaymentButton}
                onClick={handlePayWithNewMethod}
                disabled={!!chargingCardId || paymentLoading}
              >
                <IoCard />
                <span>
                  {paymentLoading
                    ? "Redirecting..."
                    : "Pay with another method"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setShowUpgradeModal(false)}
            >
              <IoClose />
            </button>
            <PricingGrid
              tiers={tiers}
              currentTier={currentTier}
              onSelectTier={handleUpgrade}
              loading={upgradingToTier}
              variant="compact"
              showHeader={true}
              showFooter={false}
              getTierLevel={getTierLevel}
            />
          </div>
        </div>
      )}
    </div>
  );
}