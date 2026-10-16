"use client";

import { useState, useEffect } from "react";

export type Lang = "EN" | "FR" | "CN";

const KEY = "nexusply_settings";

/** Language for visitors who have not picked one. */
export const DEFAULT_LANG: Lang = "FR";

export function getLanguage(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;

  const data = localStorage.getItem(KEY);
  if (!data) return DEFAULT_LANG;

  try {
    const settings = JSON.parse(data);
    return settings.language || DEFAULT_LANG;
  } catch (e) {
    return DEFAULT_LANG;
  }
}

export function setLanguage(lang: Lang) {
  if (typeof window === "undefined") return;
  
  const data = localStorage.getItem(KEY);
  let settings = data ? JSON.parse(data) : {};
  settings.language = lang;
  localStorage.setItem(KEY, JSON.stringify(settings));
  
  window.dispatchEvent(new Event("languageChanged"));
  window.dispatchEvent(new Event("settingsUpdated"));
}

export const translations = {
  EN: {
    common: {
      search: "Search",
      filter: "Filter",
      close: "Close",
      back: "Back",
      loading: "Loading...",
      upgrade: "Upgrade",
      hot: "Hot",
      recommended: "Recommended",
      loadMore: "Load More Suppliers",
      sortBy: "Sort by",
      results: "Results",
      justNow: "Just now",
      daysAgo: "days ago",
      weekAgo: "week ago",
      month: "mo",
      free: "Free",
      active: "Active",
      unavailable: "Unavailable",
    },
    navbar: {
      home: "Home",
      winning: "Winning",
      support: "Support",
      profile: "Profile",
      features: "Features",
      pricing: "Pricing",
      about: "About",
      login: "Login",
      getStarted: "Get Started",
      training: "Training",
    },
    dashboard: {
      title: "Supplier Intelligence",
      subtitle: "Discover winning products, analyze profitability, and instantly connect with high-quality, verified manufacturers.",
      stats: {
        suppliers: "Total Suppliers",
        favorites: "Saved Favorites",
        avgMoq: "Platform Avg. MOQ",
        topCategory: "Top Trending Niche",
      },
      upgrade: "Upgrade Plan",
      searchPlaceholder: "Search by niche, product, or supplier name...",
      discoveryGrid: "Discovery Grid",
      lockedTitle: "Direct Contacts Locked",
      lockedDesc: "Upgrade to Importer to unlock direct manufacturer phone numbers and WeChat IDs.",
      lockedSupplier: "Locked Supplier",
      lockedSupplierDesc: "Upgrade to see premium direct contacts and manufacturers.",
    },
    supplier: {
      moq: "MOQ",
      category: "Category",
      contact: "Contact Supplier",
      units: "Units",
      verified: "Verified Supplier",
      fastFulfillment: "Fast Fulfillment",
      trending: "Trending Supplier",
      factoryAccess: "Direct Factory Access",
      premiumOnly: "Premium Only",
      unlockAccess: "Unlock Direct Manufacturer Access",
      unlockDesc: "Skip the platform fees. Get direct contact details including WhatsApp, WeChat, and private emails for better pricing.",
      aiInsights: "Nexus AI Insights",
      profitScore: "Profit Score",
      estMargin: "Est. Margin",
      reliability: "Reliability",
      delivery: "Delivery",
      excellent: "Excellent",
      aboveAverage: "Above Average",
      highReliability: "High",
      successRate: "Success",
      globalAvg: "Global Avg",
      ratings: "Ratings & Reliability",
      basedOn: "Based on",
      reviews: "reviews",
      readyToSource: "Ready to Source?",
      readyDesc: "Connect directly to negotiate pricing and request samples.",
      minOrder: "Minimum Order",
      rateExperience: "Rate your experience",
      ratePlaceholder: "How was the product quality and shipping time?",
      submitReview: "Submit Review",
      similarSuppliers: "Similar Suppliers",
      viewDetails: "View Details",
      backToResults: "Back to Results",
      communityFeed: "Community Feed",
      noReviews: "No reviews yet. Be the first to share your experience!",
      anonymous: "Anonymous",
      upgradeToPartner: "Upgrade to Partner",
      whatsappPhone: "WhatsApp / Phone",
      wechatId: "WeChat ID",
      enterpriseEmail: "Enterprise Email",
      supplierNotFound: "Supplier Not Found",
      supplierNotFoundDesc: "We couldn't find a supplier with ID: {id}. It may have been removed.",
      returnToDashboard: "Return to Dashboard",
      tryAgain: "Try Again",
      indexedPortfolio: "Indexed Portfolio",
    },
    product: {
      backToProducts: "Back to Products",
      demandLevel: "Demand",
      viewMatchingSuppliers: "View Matching Suppliers",
      intelligenceCore: "Intelligence Core",
      profitScore: "Profit Score",
      marketTrend: "Market Trend",
      competition: "Competition",
      low: "Low",
      avgDelivery: "Avg Delivery",
      verifiedSuppliers: "Verified Suppliers",
      noSuppliers: "No verified suppliers indexed for this product category yet.",
      sourceThisProduct: "Source This Product",
      sourceThisProductDesc: "Connect with verified suppliers instantly to request samples and negotiate bulk pricing.",
      beginSourcing: "Begin Sourcing Process",
      communityInsights: "Community Insights",
      addInsight: "Add your insight",
      insightPlaceholder: "Share your sourcing experience...",
      submitInsight: "Submit Insight",
      productNotFound: "Product Not Found",
      productNotFoundDesc: "We couldn't find a product with ID: {id}. It may have been removed.",
      browseAllProducts: "Browse All Products",
      tryAgain: "Try Again",
      indexedPortfolio: "Indexed Portfolio",
    },
    search: {
      placeholder: "Search suppliers, products...",
      recent: "Recent searches",
      suggestions: "Suggestions",
      noResults: "No results found for",
    },
    training: {
      title: "Training Center",
      subtitle: "Expert-led sourcing training: documents, videos and guides to scale your import business.",
      partnerOnly: "Partner Exclusive",
      document: "Document",
      video: "Video",
      link: "Link",
      download: "Download",
      watch: "Watch",
      open: "Open",
      duration: "Duration",
      minutes: "min",
      emptyTitle: "No training published yet",
      emptyDesc: "New expert training modules are coming soon. You will be the first to know.",
      lockedTitle: "Training Is Locked",
      lockedDesc: "The Training Center is exclusive to the Partner plan — our highest tier. Upgrade to unlock expert-led documents, videos and guides.",
      back: "Back to Training",
      openOriginal: "Open Original",
      playlist: "Playlist",
      nowPlaying: "Now playing",
      upNext: "Up next",
      addVideos: "Add videos",
      videosCount: "videos",
    },
    profile: {
      contacts: "Contacted Suppliers",
      contacted: "Contacted",
      favoritesProducts: "Favorite Products",
      favoritesSuppliers: "Favorite Suppliers",
      settings: "Account Settings",
      plan: "Subscription & Billing",
      subtitle: "Manage your preferences and platform data.",
      activity: "Activity",
      logout: "Logout",
      notLoggedIn: "Please log in to view your profile",
      login: "Login",
      emptyContacts: "You haven't contacted any suppliers yet.",
      emptyFavProducts: "You haven't saved any winning products yet.",
      emptyFavSuppliers: "No favorite suppliers yet. Start sourcing!",
      currentPlan: "Current Active Plan",
      trialEnds: "Trial Ends",
      mostPopular: "MOST POPULAR",
      currentPlanBtn: "Current Plan",
      upgradeTo: "Upgrade to",
    },
    settings: {
      account: "Account",
      language: "Language",
      notifications: "Notifications",
      currency: "Currency",
      localization: "Localization",
      alerts: "Alerts & Notifications",
      username: "Username",
      email: "Email Address",
      role: "Role",
      push: "Push Notifications",
    },
    subscription: {
      trialExpired: "Trial Expired",
      trialExpiredDesc: "Your 14-day trial has ended. Please subscribe to a plan to continue accessing Nexusply.",
      choosePlan: "Choose Your Plan",
      manageSubscription: "Manage Subscription",
      backToHome: "Back to Home",
      redirecting: "Redirecting to secure payment...",
      checkoutError: "Could not start the payment. Please try again.",
      confirming: "Confirming your payment...",
      confirmed: "Payment confirmed! Your plan is active until",
      processing: "Your payment is still being processed. Your plan will activate automatically in a few minutes.",
      failed: "The payment did not go through. You can try again whenever you are ready.",
      mismatch: "We could not validate this payment. If you were charged, please contact support.",
      tryAgain: "Try again",
      renew: "Renew (+30 days)",
      expiresIn: "Expires in",
      payFrom: "Paying from",
    },
    featureUi: {
      "lockedLabel": "Locked feature",
      "seePlans": "See plans",
      "winning": {
        "eyebrow": "Winning products",
        "searchPlaceholder": "Search by niche, name or category…",
        "topFive": "The Top 5",
        "topResults": "Top results",
        "emerging": "Emerging opportunities",
        "noProducts": "No products match your search.",
        "delayNote": "Your plan shows new winners with a {h} h delay. Upgrade to Importer for instant access.",
        "lockedTitle": "Winning products are locked",
        "lockedDesc": "Your {plan} plan doesn't include winning products. Upgrade to discover high-margin products updated in real time.",
        "unlockMoreTitle": "Unlock {n}+ winning products",
        "unlockMoreDesc": "You're seeing a limited selection on the {plan} plan. Upgrade to access the full database.",
        "lockedProduct": "Locked product",
        "lockedProductDesc": "Upgrade your plan to see this product.",
        "trending": "Trending"
      },
      "product": {
        "eyebrow": "Product",
        "insightsLabel": "Insights",
        "suppliersLabel": "Suppliers",
        "sourcingLabel": "Sourcing",
        "reviewsLabel": "Reviews"
      },
      "calculator": {
        "title": "Profit simulator",
        "plan": "Plan",
        "buyPrice": "Buy price",
        "sellPrice": "Sell price",
        "shipping": "Shipping (total)",
        "weight": "Weight (kg)",
        "cbm": "Volume (CBM)",
        "adSpend": "Est. ad spend",
        "netProfit": "Est. net profit",
        "roi": "ROI",
        "lockedNote": "Upgrade to Importer to unlock shipping, CBM and net margin.",
        "lockedBadge": "Importer+"
      },
      "training": {
        "eyebrow": "Training center"
      }
    },
    dashboardUi: {
      "eyebrow": "Dashboard",
      "searchResults": "Search results",
      "noSuppliers": "No suppliers match your criteria.",
      "clearSearch": "Clear search",
      "filters": "Filters",
      "reset": "Reset",
      "quickFilters": "Quick filters",
      "verifiedOnly": "Verified only",
      "primaryCategory": "Primary category",
      "subCategory": "Sub-category",
      "selectCategoryFirst": "Select a category first",
      "applyFilters": "Apply filters",
      "categories": {
        "Electronics": "Electronics",
        "Clothing": "Clothing",
        "Home": "Home",
        "Beauty": "Beauty"
      },
      "recommendedForYou": "Recommended for you",
      "suggestedSuppliers": "Suggested suppliers",
      "suggestedLabel": "Picks",
      "unlockTitle": "Unlock every supplier",
      "unlockDesc": "You're seeing a limited selection on the {plan} plan. Upgrade to access the full network.",
      "upgradeNow": "See plans",
      "supplier": {
        "overview": "Overview",
        "contactLabel": "Contact",
        "portfolioLabel": "Catalog",
        "portfolioTitle": "Products offered",
        "insightsLabel": "Insights",
        "reviewsLabel": "Reviews",
        "rating": "Rating",
        "reviewCount": "Reviews",
        "days": "days",
        "noDirectContact": "No direct contact found. Please use the platform contact link."
      }
    },
    landing: {
      "nav": {
        "product": "Product",
        "solutions": "Solutions",
        "ai": "Nexus AI",
        "pricing": "Pricing",
        "faq": "FAQ",
        "login": "Log in",
        "start": "Get started"
      },
      "announce": {
        "tag": "New",
        "text": "Pay with mobile money in 15 countries"
      },
      "hero": {
        "title": "Your intelligent importing assistant",
        "subtitle": "Find verified suppliers, spot winning products and know your margin before you buy. All in one place.",
        "primary": "Start for free",
        "secondary": "See pricing",
        "scroll": "Scroll"
      },
      "intro": {
        "label": "Redefining importing",
        "title": "Import faster, with less risk",
        "desc": "Nexusply replaces hours of research with clear data, so you buy at the right price and resell with a real margin.",
        "stats": [
          {
            "value": "10K+",
            "label": "Suppliers analyzed"
          },
          {
            "value": "+45%",
            "label": "Average margin increase"
          },
          {
            "value": "15",
            "label": "Countries with mobile money"
          }
        ]
      },
      "product": {
        "label": "Product",
        "title": "Built for importers who move fast",
        "desc": "Three tools that cover the whole journey, from supplier to resale.",
        "learnMore": "Explore",
        "items": [
          {
            "tab": "Verified suppliers",
            "title": "Reliable suppliers, no guesswork",
            "desc": "Prices, lead times, minimum order, reviews and a reliability score for every supplier on Alibaba, 1688 and beyond.",
            "metric": "10K+",
            "metricLabel": "suppliers analyzed"
          },
          {
            "tab": "Winning products",
            "title": "Spot trends before everyone else",
            "desc": "High-demand, low-competition products, updated continuously, with their resale potential.",
            "metric": "0 h",
            "metricLabel": "delay on new finds with the Importer plan"
          },
          {
            "tab": "Profit calculator",
            "title": "Know your margin before you buy",
            "desc": "Purchase price, shipping, CBM and fees: the calculator gives your real margin and a suggested resale price.",
            "metric": "+45%",
            "metricLabel": "average margin"
          }
        ]
      },
      "solutions": {
        "label": "Solutions",
        "title": "Fits the way you sell",
        "desc": "Whether you're testing your first product or turning over stock, Nexusply keeps up.",
        "items": [
          {
            "tab": "Beginners",
            "desc": "Test the market on a small budget: suppliers from the big platforms, a basic calculator and one winning product a month.",
            "metric": "30 days",
            "metricLabel": "of access per payment, no commitment"
          },
          {
            "tab": "Importers",
            "desc": "Every brand, tablets and computers, direct supplier contacts and real-time winning products.",
            "metric": "CBM",
            "metricLabel": "full shipping and margin calculation"
          },
          {
            "tab": "Resellers",
            "desc": "Early access to the latest releases, every supplier, priority access and the training center.",
            "metric": "Priority",
            "metricLabel": "support and early access"
          },
          {
            "tab": "E-commerce",
            "desc": "Compare prices across sellers, estimate your ad budget and track favorites from a single dashboard.",
            "metric": "1",
            "metricLabel": "dashboard to run it all"
          }
        ]
      },
      "ai": {
        "label": "Nexus AI",
        "title": "Ask questions, get answers with numbers",
        "desc": "Your sourcing advisor looks at your budget, niche and target market to recommend what to buy, and where.",
        "points": [
          "Find trending products in a niche",
          "Compare suppliers for the same product",
          "Estimate profit before you order"
        ],
        "cta": "Try it now"
      },
      "steps": {
        "label": "How it works",
        "title": "From idea to order in 4 steps",
        "items": [
          {
            "title": "Pick your niche",
            "desc": "Phones, tablets, computers: filter by category, budget and target market."
          },
          {
            "title": "Compare suppliers",
            "desc": "Price, minimum order, lead time and reliability score, side by side."
          },
          {
            "title": "Calculate your margin",
            "desc": "Add shipping and fees: see your real profit before you buy."
          },
          {
            "title": "Order and resell",
            "desc": "Contact the supplier directly and follow trends to restock at the right time."
          }
        ]
      },
      "band": {
        "quote": "Buy at the right price. Resell with a real margin.",
        "caption": "Nexusply, supplier intelligence for Africa"
      },
      "pricing": {
        "label": "Pricing",
        "title": "Simple prices, paid with mobile money",
        "desc": "Each payment gives you 30 days of access. No automatic subscription: renew whenever you want.",
        "popular": "Most popular",
        "perMonth": "/ 30 days"
      },
      "faq": {
        "label": "FAQ",
        "title": "Your questions, answered",
        "items": [
          {
            "q": "How can I pay?",
            "a": "With mobile money or card, through our secure payment partner SasPay. Pick your country above the prices to see them in your currency."
          },
          {
            "q": "Is it an automatic subscription?",
            "a": "No. Each payment gives 30 days of access. You renew whenever you like; nothing is charged automatically."
          },
          {
            "q": "Can I change plans?",
            "a": "Yes, anytime. If you switch plans during a running period, the remaining time is converted and added to your new plan."
          },
          {
            "q": "Which countries can pay?",
            "a": "Today: Cameroon, Gabon, Congo, Côte d'Ivoire, Senegal, Benin, Togo, Burkina Faso, Mali, Niger, DR Congo, Nigeria, Ghana, Guinea and Sierra Leone. More countries are coming."
          },
          {
            "q": "Can I explore before paying?",
            "a": "Yes. Create a free account to explore Nexusply, then pick a plan when you're ready."
          },
          {
            "q": "Are suppliers verified?",
            "a": "Every supplier shows prices, lead times, minimum order, reviews and a reliability score, to help you avoid risky sellers."
          }
        ]
      },
      "cta": {
        "label": "Get started",
        "title": "Join the importers who buy smarter",
        "desc": "Create your account in a minute. Pick a plan when you're ready.",
        "primary": "Start for free",
        "secondary": "Log in"
      },
      "footer": {
        "tagline": "Turning supplier data into profitable decisions.",
        "product": "Product",
        "company": "Company",
        "legal": "Legal",
        "features": "Features",
        "solutions": "Solutions",
        "pricing": "Pricing",
        "faq": "FAQ",
        "dashboard": "Dashboard",
        "support": "Help center",
        "contact": "Contact us",
        "terms": "Terms",
        "privacy": "Privacy",
        "rights": "© 2026 Nexusply. All rights reserved."
      }
    },
    heroCarousel: {
      intro: "Nexusply Intelligence",
      slides: [
        {
          title: "Global Sourcing Simplified",
          desc: "Connect with the world's most reliable manufacturers in just a few clicks."
        },
        {
          title: "Discover Winning Products",
          desc: "Our AI-powered insights reveal the next big market trends before they explode."
        },
        {
          title: "Verified Supplier Network",
          desc: "Trade with confidence. Every supplier on Nexusply is thoroughly vetted for quality."
        },
        {
          title: "Elite Market Intelligence",
          desc: "Data-driven decisions for modern importers and e-commerce entrepreneurs."
        }
      ],
      cta: {
        getStarted: "Get Started Free",
        learnMore: "Learn More"
      }
    },
    hero: {
      intro: "Introducing Nexusply Intelligence",
      title: "The Future of Supplier Intelligence:",
      subtitle: "Data & Profit Combined",
      description: "Discover winning suppliers, optimize margins, and scale your business with AI-powered insights and real-time market data.",
      explore: "Explore Features",
      getStarted: "Get Started Free"
    },
    features: {
      badge: "Platform Features",
      title: "The Complete",
      highlight: "Supplier Command Center",
      description: "Everything you need to discover, analyze, and dominate supplier markets.",
      items: {
        discovery: {
          title: "Supplier Discovery Engine",
          desc: "Find the best suppliers worldwide with smart AI-powered filtering, ranking, and niche targeting."
        },
        profiles: {
          title: "Supplier Profiles",
          desc: "Access detailed supplier data including pricing tiers, delivery times, reviews, and reliability scores."
        },
        winning: {
          title: "Winning Products",
          desc: "Identify trending, high-demand products with strong margins using real-time data insights."
        },
        comparison: {
          title: "Price Comparison",
          desc: "Compare supplier pricing, shipping costs, and profit margins instantly across multiple vendors."
        },
        simulator: {
          title: "Profit Simulator",
          desc: "Calculate ROI, break-even points, and profit margins before making sourcing decisions."
        },
        affiliate: {
          title: "Affiliate & Partner System",
          desc: "Monetize your network with referral links, commissions, and advanced partner analytics."
        },
        advisor: {
          title: "AI Supplier Advisor",
          desc: "Get intelligent recommendations based on your budget, niche, and target market."
        },
        autosourcing: {
          title: "Auto Sourcing Mode",
          desc: "Describe a product and let AI find, compare, and recommend the best suppliers instantly."
        },
        trust: {
          title: "Trust & Risk Scoring",
          desc: "Avoid unreliable suppliers with AI-powered fraud detection and trust scoring."
        }
      }
    },
    about: {
      badge: "About Nexusply",
      title: "Redefining",
      highlight: "Supplier Intelligence",
      description1: "Nexusply is a next-generation supplier intelligence platform built to help entrepreneurs discover high-performing suppliers, identify winning products, and maximize profit margins using AI-driven insights.",
      description2: "Instead of guessing, you operate with data. Instead of testing blindly, you execute with precision.",
      stats: {
        suppliers: {
          value: "10K+",
          label: "Suppliers analyzed"
        },
        profit: {
          value: "+45%",
          label: "Avg profit increase"
        },
        ai: {
          value: "AI",
          label: "Smart sourcing engine"
        },
        global: {
          value: "Global",
          label: "Supplier network"
        }
      }
    },
    howItWorks: {
      title: "How Nexusply",
      highlight: "Functions",
      description: "We've simplified the complex world of global sourcing into a streamlined 4-step process powered by advanced data intelligence.",
      step1: {
        title: "1. Connect Data Sources",
        desc: "Nexusply aggregates live data from global marketplaces like Alibaba, 1688, and CJ Dropshipping, providing you with a unified dashboard."
      },
      step2: {
        title: "2. Analyze & Compare",
        desc: "Use our AI engine to compare MOQ, shipping times, and reliability scores across thousands of verified manufacturers instantly."
      },
      step3: {
        title: "3. Identify Winners",
        desc: "Our profit simulator calculates real margins, helping you spot trending products with high demand and low competition."
      },
      step4: {
        title: "4. Scale With AI",
        desc: "Receive daily AI-driven recommendations on stock levels, price adjustments, and new sourcing opportunities to dominate your niche."
      }
    },
    pricing: {
      title: "Pricing",
      plans: {
        basic: {
          title: "Explorer Plan",
          price: "1,700 FCFA",
          features: [
            "Entry/mid-range phones",
            "Tablets & computers access",
            "Basic calculator",
            "1 winning product/mo (48h delay)",
            "Platform suppliers (Alibaba, 1688...)",
            "Community WhatsApp channel"
          ],
          cta: "Get Started"
        },
        standard: {
          title: "Importer Plan",
          price: "2,900 FCFA",
          features: [
            "All brands + foldable phones",
            "All tablet brands",
            "MacBook & entry-level Gaming PCs",
            "Full calculator (CBM + margin)",
            "Real-time winning products",
            "Suppliers + direct contacts",
            "Community WhatsApp channel"
          ],
          cta: "Get Started"
        },
        premium: {
          title: "Partner Plan",
          price: "4,000 FCFA",
          features: [
            "Latest releases + instant news",
            "Latest generation tablets",
            "High-end MacBook & Gaming PCs",
            "Full calculator (+ ad estimation)",
            "Preview winning products",
            "All suppliers + priority access",
            "Priority WhatsApp channel"
          ],
          cta: "Get Started"
        }
      }
    },
    footer: {
      cta: {
        title: "Continue Your",
        highlight: "Success Story",
        description: "Join thousands of entrepreneurs using Nexusply to find winning suppliers and maximize profits.",
        placeholder: "your@email.com",
        button: "Get Started",
        note: "No spam. Only valuable insights."
      },
      brand: {
        desc: "Transforming supplier data into profitable decisions."
      },
      sections: {
        product: "Product",
        resources: "Resources",
        company: "Company",
        support: "Support"
      },
      links: {
        dashboard: "Dashboard",
        winningProducts: "Winning Products",
        aiInsights: "AI Insights",
        features: "Features",
        pricing: "Pricing",
        howItWorks: "How it Works",
        about: "About",
        terms: "Terms",
        privacy: "Privacy",
        helpCenter: "Help Center",
        contactUs: "Contact Us"
      },
      bottom: {
        rights: "© 2026 Nexusply. All rights reserved.",
        privacy: "Privacy",
        terms: "Terms",
        security: "Security"
      }
    },
    auth: {
      agreeTerms: "I agree to the Terms of Service and Privacy Policy",
      mustAgree: "You must agree to the Terms of Service and Privacy Policy",
      loginTitle: "Welcome back",
      loginSubtitle: "Enter your credentials to access Nexusply",
      emailLabel: "Email",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm Password",
      loginButton: "Sign in",
      loggingIn: "Signing in...",
      noAccount: "Don't have an account?",
      signupLink: "Sign up",
      signupTitle: "Create an account",
      signupSubtitle: "Start optimizing your supplier strategy today",
      signupButton: "Get Started",
      signingUp: "Creating account...",
      hasAccount: "Already have an account?",
      loginLink: "Login",
      allFieldsRequired: "All fields are required",
      passwordsDoNotMatch: "Passwords do not match",
      checkEmail: "Check your email to confirm your account",
      loginSuccess: "Successfully logged in",
      signupSuccess: "Account created successfully",
      panelTitle: "Access your supplier command center",
      panelDesc: "Discover, compare, and optimize sourcing decisions with precision.",
    },
    policies: {
      privacy: {
        title: "Privacy Policy",
        lastUpdated: "Last Updated: June 2026",
        intro: "At Nexusply, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.",
        sections: [
          {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us when you create an account, such as your name, email address, and payment information. We also collect usage data to improve our services."
          },
          {
            title: "2. How We Use Your Information",
            content: "We use your information to provide and maintain our services, process transactions, and communicate with you about updates or promotional offers."
          },
          {
            title: "3. Data Security",
            content: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure."
          },
          {
            title: "4. Your Rights",
            content: "You have the right to access, correct, or delete your personal information at any time through your account settings."
          }
        ]
      },
      terms: {
        title: "Terms of Service",
        lastUpdated: "Last Updated: June 2026",
        intro: "By using Nexusply, you agree to these terms. Please read them carefully.",
        sections: [
          {
            title: "1. Acceptance of Terms",
            content: "By accessing or using our platform, you agree to be bound by these Terms of Service and all applicable laws and regulations."
          },
          {
            title: "2. User Accounts",
            content: "You are responsible for maintaining the confidentiality of your account and password. You must be at least 18 years old to use our services."
          },
          {
            title: "3. Subscription and Billing",
            content: "Certain features require a paid subscription. All fees are non-refundable unless required by law."
          },
          {
            title: "4. Prohibited Conduct",
            content: "You agree not to use the platform for any unlawful purpose or in any way that could damage or impair our services."
          }
        ]
      }
    },
  },
  FR: {
    common: {
      search: "Recherche",
      filter: "Filtrer",
      close: "Fermer",
      back: "Retour",
      loading: "Chargement...",
      upgrade: "Améliorer",
      hot: "Top",
      recommended: "Recommandé",
      loadMore: "Plus de fournisseurs",
      sortBy: "Trier par",
      results: "Résultats",
      justNow: "À l'instant",
      daysAgo: "jours",
      weekAgo: "semaine",
      month: "mo",
      free: "Gratuit",
      active: "Actif",
      unavailable: "Indisponible",
    },
    navbar: {
      home: "Accueil",
      winning: "Tendances",
      support: "Support",
      profile: "Profil",
      features: "Fonctionnalités",
      pricing: "Tarifs",
      about: "À propos",
      login: "Connexion",
      getStarted: "Démarrer",
      training: "Formation",
    },
    dashboard: {
      title: "Intelligence Fournisseurs",
      subtitle: "Découvrez les produits gagnants, analysez la rentabilité et connectez-vous instantanément avec des fabricants vérifiés.",
      stats: {
        suppliers: "Total Fournisseurs",
        favorites: "Favoris enregistrés",
        avgMoq: "MOQ moyen plateforme",
        topCategory: "Niche tendance",
      },
      upgrade: "Améliorer le plan",
      searchPlaceholder: "Rechercher par niche, produit ou nom...",
      discoveryGrid: "Grille de découverte",
      lockedTitle: "Contacts directs verrouillés",
      lockedDesc: "Passez au plan Importateur pour débloquer les numéros de téléphone et WeChat des fabricants.",
      lockedSupplier: "Fournisseur verrouillé",
      lockedSupplierDesc: "Améliorez votre plan pour voir les contacts directs premium.",
    },
    supplier: {
      moq: "MOQ",
      category: "Catégorie",
      contact: "Contacter",
      units: "Unités",
      verified: "Fournisseur vérifié",
      fastFulfillment: "Expédition rapide",
      trending: "Fournisseur tendance",
      factoryAccess: "Accès direct usine",
      premiumOnly: "Premium uniquement",
      unlockAccess: "Débloquer l'accès direct",
      unlockDesc: "Évitez les frais de plateforme. Obtenez les contacts directs (WhatsApp, WeChat) pour de meilleurs prix.",
      aiInsights: "Analyses Nexus IA",
      profitScore: "Score de profit",
      estMargin: "Marge est.",
      reliability: "Fiabilité",
      delivery: "Livraison",
      excellent: "Excellent",
      aboveAverage: "Supérieur",
      highReliability: "Haute",
      successRate: "Succès",
      globalAvg: "Moyenne mondiale",
      ratings: "Évaluations et fiabilité",
      basedOn: "Basé sur",
      reviews: "avis",
      readyToSource: "Prêt à commander ?",
      readyDesc: "Connectez-vous directement pour négocier les prix et demander des échantillons.",
      minOrder: "Commande minimum",
      rateExperience: "Notez votre expérience",
      ratePlaceholder: "Comment était la qualité du produit et le délai de livraison ?",
      submitReview: "Envoyer l'avis",
      similarSuppliers: "Fournisseurs similaires",
      viewDetails: "Voir détails",
      backToResults: "Retour aux résultats",
      communityFeed: "Flux communautaire",
      noReviews: "Aucun avis pour le moment. Soyez le premier à partager votre expérience !",
      anonymous: "Anonyme",
      upgradeToPartner: "Passer au plan Partenaire",
      whatsappPhone: "WhatsApp / Téléphone",
      wechatId: "ID WeChat",
      enterpriseEmail: "E-mail d'entreprise",
      supplierNotFound: "Fournisseur non trouvé",
      supplierNotFoundDesc: "Nous n'avons pas pu trouver de fournisseur avec l'ID : {id}. Il a peut-être été supprimé.",
      returnToDashboard: "Retour au tableau de bord",
      tryAgain: "Réessayer",
    },
    product: {
      backToProducts: "Retour aux produits",
      demandLevel: "Demande",
      viewMatchingSuppliers: "Voir les fournisseurs correspondants",
      intelligenceCore: "Noyau d'intelligence",
      profitScore: "Score de profit",
      marketTrend: "Tendance du marché",
      competition: "Concurrence",
      low: "Faible",
      avgDelivery: "Livraison moyenne",
      verifiedSuppliers: "Fournisseurs vérifiés",
      noSuppliers: "Aucun fournisseur vérifié indexé pour cette catégorie de produits pour le moment.",
      sourceThisProduct: "Sourcer ce produit",
      sourceThisProductDesc: "Connectez-vous instantanément avec des fournisseurs vérifiés pour demander des échantillons et négocier des prix de gros.",
      beginSourcing: "Lancer le processus de sourcing",
      communityInsights: "Avis de la communauté",
      addInsight: "Ajoutez votre avis",
      insightPlaceholder: "Partagez votre expérience de sourcing...",
      submitInsight: "Envoyer l'avis",
      productNotFound: "Produit non trouvé",
      productNotFoundDesc: "Nous n'avons pas pu trouver de produit avec l'ID : {id}. Il a peut-être été supprimé.",
      browseAllProducts: "Parcourir tous les produits",
      tryAgain: "Réessayer",
    },
    search: {
      placeholder: "Rechercher fournisseurs, produits...",
      recent: "Recherches récentes",
      suggestions: "Suggestions",
      noResults: "Aucun résultat trouvé pour",
    },
    training: {
      title: "Centre de formation",
      subtitle: "Formations animées par des experts : documents, vidéos et guides pour développer votre activité d'import.",
      partnerOnly: "Exclusivité Partenaire",
      document: "Document",
      video: "Vidéo",
      link: "Lien",
      download: "Télécharger",
      watch: "Regarder",
      open: "Ouvrir",
      duration: "Durée",
      minutes: "min",
      emptyTitle: "Aucune formation publiée pour le moment",
      emptyDesc: "De nouveaux modules de formation arrivent bientôt. Vous serez les premiers informés.",
      lockedTitle: "La formation est verrouillée",
      lockedDesc: "Le Centre de formation est exclusif au plan Partenaire — notre offre la plus élevée. Améliorez votre plan pour débloquer documents, vidéos et guides d'experts.",
      back: "Retour aux formations",
      openOriginal: "Ouvrir l'original",
      playlist: "Liste de lecture",
      nowPlaying: "En cours de lecture",
      upNext: "À suivre",
      addVideos: "Ajouter des vidéos",
      videosCount: "vidéos",
    },
    profile: {
      contacts: "Fournisseurs contactés",
      contacted: "Contactés",
      favoritesProducts: "Produits favoris",
      favoritesSuppliers: "Fournisseurs favoris",
      settings: "Paramètres du compte",
      plan: "Abonnement et facturation",
      subtitle: "Gérez vos préférences et vos données.",
      activity: "Activité",
      logout: "Déconnexion",
      notLoggedIn: "Veuillez vous connecter pour voir votre profil",
      login: "Connexion",
      emptyContacts: "Vous n'avez pas encore contacté de fournisseurs.",
      emptyFavProducts: "Vous n'avez pas encore enregistré de produits gagnants.",
      emptyFavSuppliers: "Pas encore de fournisseurs favoris. Commencez à sourcer !",
      currentPlan: "Abonnement actuel",
      trialEnds: "Fin de l'essai",
      mostPopular: "PLUS POPULAIRE",
      currentPlanBtn: "Plan actuel",
      upgradeTo: "Passer à",
    },
    settings: {
      account: "Compte",
      language: "Langue",
      notifications: "Notifications",
      currency: "Devise",
      localization: "Localisation",
      alerts: "Alertes et notifications",
      username: "Nom d'utilisateur",
      email: "Adresse e-mail",
      role: "Rôle",
      push: "Notifications push",
    },
    subscription: {
      trialExpired: "Essai Terminé",
      trialExpiredDesc: "Votre période d'essai de 14 jours est terminée. Veuillez vous abonner à un plan pour continuer à utiliser Nexusply.",
      choosePlan: "Choisissez votre plan",
      manageSubscription: "Gérer l'abonnement",
      backToHome: "Retour à l'accueil",
      redirecting: "Redirection vers le paiement sécurisé...",
      checkoutError: "Impossible de lancer le paiement. Veuillez réessayer.",
      confirming: "Confirmation de votre paiement...",
      confirmed: "Paiement confirmé ! Votre plan est actif jusqu'au",
      processing: "Votre paiement est en cours de traitement. Votre plan sera activé automatiquement dans quelques minutes.",
      failed: "Le paiement n'a pas abouti. Vous pouvez réessayer quand vous voulez.",
      mismatch: "Nous n'avons pas pu valider ce paiement. Si vous avez été débité, contactez le support.",
      tryAgain: "Réessayer",
      renew: "Renouveler (+30 jours)",
      expiresIn: "Expire dans",
      payFrom: "Paiement depuis",
    },
    featureUi: {
      "lockedLabel": "Fonctionnalité verrouillée",
      "seePlans": "Voir les plans",
      "winning": {
        "eyebrow": "Produits gagnants",
        "searchPlaceholder": "Rechercher par niche, nom ou catégorie…",
        "topFive": "Le Top 5",
        "topResults": "Meilleurs résultats",
        "emerging": "Opportunités émergentes",
        "noProducts": "Aucun produit ne correspond à votre recherche.",
        "delayNote": "Votre plan affiche les nouveautés avec {h} h de délai. Passez au plan Importateur pour un accès immédiat.",
        "lockedTitle": "Les produits gagnants sont verrouillés",
        "lockedDesc": "Votre plan {plan} n'inclut pas les produits gagnants. Passez à un plan supérieur pour découvrir les produits à forte marge, mis à jour en temps réel.",
        "unlockMoreTitle": "Débloquez {n}+ produits gagnants",
        "unlockMoreDesc": "Vous voyez une sélection limitée avec le plan {plan}. Passez à un plan supérieur pour accéder à toute la base.",
        "lockedProduct": "Produit verrouillé",
        "lockedProductDesc": "Passez à un plan supérieur pour voir ce produit.",
        "trending": "Tendance"
      },
      "product": {
        "eyebrow": "Produit",
        "insightsLabel": "Analyses",
        "suppliersLabel": "Fournisseurs",
        "sourcingLabel": "Sourcing",
        "reviewsLabel": "Avis"
      },
      "calculator": {
        "title": "Simulateur de profit",
        "plan": "Plan",
        "buyPrice": "Prix d'achat",
        "sellPrice": "Prix de vente",
        "shipping": "Transport (total)",
        "weight": "Poids (kg)",
        "cbm": "Volume (CBM)",
        "adSpend": "Budget pub estimé",
        "netProfit": "Profit net estimé",
        "roi": "ROI",
        "lockedNote": "Passez au plan Importateur pour débloquer le transport, le CBM et la marge nette.",
        "lockedBadge": "Importateur+"
      },
      "training": {
        "eyebrow": "Centre de formation"
      }
    },
    dashboardUi: {
      "eyebrow": "Tableau de bord",
      "searchResults": "Résultats de recherche",
      "noSuppliers": "Aucun fournisseur ne correspond à vos critères.",
      "clearSearch": "Effacer la recherche",
      "filters": "Filtres",
      "reset": "Réinitialiser",
      "quickFilters": "Filtres rapides",
      "verifiedOnly": "Vérifiés uniquement",
      "primaryCategory": "Catégorie principale",
      "subCategory": "Sous-catégorie",
      "selectCategoryFirst": "Choisissez d'abord une catégorie",
      "applyFilters": "Appliquer les filtres",
      "categories": {
        "Electronics": "Électronique",
        "Clothing": "Vêtements",
        "Home": "Maison",
        "Beauty": "Beauté"
      },
      "recommendedForYou": "Recommandé pour vous",
      "suggestedSuppliers": "Fournisseurs suggérés",
      "suggestedLabel": "Sélection",
      "unlockTitle": "Débloquez tous les fournisseurs",
      "unlockDesc": "Vous voyez une sélection limitée avec le plan {plan}. Passez à un plan supérieur pour accéder à tout le réseau.",
      "upgradeNow": "Voir les plans",
      "supplier": {
        "overview": "Aperçu",
        "contactLabel": "Contact",
        "portfolioLabel": "Catalogue",
        "portfolioTitle": "Produits proposés",
        "insightsLabel": "Analyses",
        "reviewsLabel": "Avis",
        "rating": "Note",
        "reviewCount": "Avis",
        "days": "jours",
        "noDirectContact": "Aucun contact direct trouvé. Utilisez le lien de contact de la plateforme."
      }
    },
    landing: {
      "nav": {
        "product": "Produit",
        "solutions": "Solutions",
        "ai": "Nexus AI",
        "pricing": "Tarifs",
        "faq": "FAQ",
        "login": "Connexion",
        "start": "Démarrer"
      },
      "announce": {
        "tag": "Nouveau",
        "text": "Paiement par mobile money dans 15 pays"
      },
      "hero": {
        "title": "Votre assistant d'importation intelligent",
        "subtitle": "Trouvez des fournisseurs vérifiés, repérez les produits gagnants et connaissez votre marge avant d'acheter. Tout au même endroit.",
        "primary": "Commencer gratuitement",
        "secondary": "Voir les tarifs",
        "scroll": "Défiler"
      },
      "intro": {
        "label": "Redéfinir l'import",
        "title": "Importez plus vite, avec moins de risques",
        "desc": "Nexusply remplace des heures de recherche par des données claires, pour acheter au bon prix et revendre avec une vraie marge.",
        "stats": [
          {
            "value": "10K+",
            "label": "Fournisseurs analysés"
          },
          {
            "value": "+45 %",
            "label": "Hausse moyenne de marge"
          },
          {
            "value": "15",
            "label": "Pays où payer en mobile money"
          }
        ]
      },
      "product": {
        "label": "Produit",
        "title": "Conçu pour les importateurs qui avancent vite",
        "desc": "Trois outils qui couvrent tout le parcours, du fournisseur à la revente.",
        "learnMore": "Découvrir",
        "items": [
          {
            "tab": "Fournisseurs vérifiés",
            "title": "Des fournisseurs fiables, sans deviner",
            "desc": "Prix, délais, minimum de commande, avis et score de fiabilité pour chaque fournisseur d'Alibaba, 1688 et au-delà.",
            "metric": "10K+",
            "metricLabel": "fournisseurs analysés"
          },
          {
            "tab": "Produits gagnants",
            "title": "Repérez les tendances avant les autres",
            "desc": "Les produits à forte demande et faible concurrence, mis à jour en continu, avec leur potentiel de revente.",
            "metric": "0 h",
            "metricLabel": "de délai sur les nouveautés avec le plan Importateur"
          },
          {
            "tab": "Calculateur de profit",
            "title": "Connaissez votre marge avant d'acheter",
            "desc": "Prix d'achat, transport, CBM et frais : le calculateur donne votre marge réelle et un prix de revente conseillé.",
            "metric": "+45 %",
            "metricLabel": "de marge moyenne"
          }
        ]
      },
      "solutions": {
        "label": "Solutions",
        "title": "Adapté à votre façon de vendre",
        "desc": "Que vous testiez votre premier produit ou que vous fassiez tourner un stock, Nexusply suit votre rythme.",
        "items": [
          {
            "tab": "Débutants",
            "desc": "Testez le marché avec un petit budget : fournisseurs des grandes plateformes, calculatrice de base et un produit gagnant par mois.",
            "metric": "30 jours",
            "metricLabel": "d'accès par paiement, sans engagement"
          },
          {
            "tab": "Importateurs",
            "desc": "Toutes les marques, tablettes et ordinateurs, contacts directs des fournisseurs et produits gagnants en temps réel.",
            "metric": "CBM",
            "metricLabel": "calcul complet du transport et de la marge"
          },
          {
            "tab": "Revendeurs",
            "desc": "Les dernières sorties en avant-première, tous les fournisseurs, un accès prioritaire et le centre de formation.",
            "metric": "Priorité",
            "metricLabel": "sur le support et les nouveautés"
          },
          {
            "tab": "E-commerce",
            "desc": "Comparez les prix entre vendeurs, estimez votre budget publicitaire et suivez vos favoris depuis un seul tableau de bord.",
            "metric": "1",
            "metricLabel": "tableau de bord pour tout piloter"
          }
        ]
      },
      "ai": {
        "label": "Nexus AI",
        "title": "Posez vos questions, recevez des réponses chiffrées",
        "desc": "Votre conseiller sourcing analyse votre budget, votre niche et votre marché cible pour vous recommander quoi acheter, et où.",
        "points": [
          "Trouver les produits tendance d'une niche",
          "Comparer des fournisseurs pour un même produit",
          "Estimer le profit avant de commander"
        ],
        "cta": "Essayer maintenant"
      },
      "steps": {
        "label": "Comment ça marche",
        "title": "De l'idée à la commande en 4 étapes",
        "items": [
          {
            "title": "Choisissez votre niche",
            "desc": "Téléphones, tablettes, ordinateurs : filtrez par catégorie, budget et marché cible."
          },
          {
            "title": "Comparez les fournisseurs",
            "desc": "Prix, minimum de commande, délais et score de fiabilité, côte à côte."
          },
          {
            "title": "Calculez votre marge",
            "desc": "Ajoutez transport et frais : vous voyez le profit réel avant d'acheter."
          },
          {
            "title": "Commandez et revendez",
            "desc": "Contactez le fournisseur en direct et suivez les tendances pour réassortir au bon moment."
          }
        ]
      },
      "band": {
        "quote": "Achetez au bon prix. Revendez avec une vraie marge.",
        "caption": "Nexusply, l'intelligence fournisseur pour l'Afrique"
      },
      "pricing": {
        "label": "Tarifs",
        "title": "Des prix simples, payés en mobile money",
        "desc": "Chaque paiement vous donne 30 jours d'accès. Pas d'abonnement automatique : vous renouvelez quand vous voulez.",
        "popular": "Le plus choisi",
        "perMonth": "/ 30 jours"
      },
      "faq": {
        "label": "FAQ",
        "title": "Vos questions, nos réponses",
        "items": [
          {
            "q": "Comment puis-je payer ?",
            "a": "Par mobile money ou par carte, via notre partenaire de paiement sécurisé SasPay. Choisissez votre pays au-dessus des tarifs pour voir le prix dans votre monnaie."
          },
          {
            "q": "Est-ce un abonnement automatique ?",
            "a": "Non. Chaque paiement donne 30 jours d'accès. Vous renouvelez quand vous le souhaitez ; rien n'est prélevé automatiquement."
          },
          {
            "q": "Puis-je changer de plan ?",
            "a": "Oui, à tout moment. Si vous changez de plan pendant une période en cours, le temps restant est converti et ajouté à votre nouveau plan."
          },
          {
            "q": "Dans quels pays le paiement est-il disponible ?",
            "a": "Aujourd'hui : Cameroun, Gabon, Congo, Côte d'Ivoire, Sénégal, Bénin, Togo, Burkina Faso, Mali, Niger, RD Congo, Nigeria, Ghana, Guinée et Sierra Leone. D'autres pays arrivent."
          },
          {
            "q": "Puis-je découvrir la plateforme avant de payer ?",
            "a": "Oui. Créez un compte gratuit pour explorer Nexusply, puis choisissez un plan quand vous êtes prêt."
          },
          {
            "q": "Les fournisseurs sont-ils vérifiés ?",
            "a": "Chaque fournisseur affiche ses prix, délais, minimum de commande, avis et un score de fiabilité, pour vous aider à éviter les vendeurs à risque."
          }
        ]
      },
      "cta": {
        "label": "Commencer",
        "title": "Rejoignez les importateurs qui achètent mieux",
        "desc": "Créez votre compte en une minute. Choisissez un plan quand vous êtes prêt.",
        "primary": "Commencer gratuitement",
        "secondary": "Se connecter"
      },
      "footer": {
        "tagline": "Transformer les données fournisseurs en décisions rentables.",
        "product": "Produit",
        "company": "Entreprise",
        "legal": "Légal",
        "features": "Fonctionnalités",
        "solutions": "Solutions",
        "pricing": "Tarifs",
        "faq": "FAQ",
        "dashboard": "Tableau de bord",
        "support": "Centre d'aide",
        "contact": "Nous contacter",
        "terms": "Conditions",
        "privacy": "Confidentialité",
        "rights": "© 2026 Nexusply. Tous droits réservés."
      }
    },
    heroCarousel: {
      intro: "Nexusply Intelligence",
      slides: [
        {
          title: "Sourcing mondial simplifié",
          desc: "Connectez-vous aux fabricants les plus fiables au monde en quelques clics."
        },
        {
          title: "Découvrez des produits gagnants",
          desc: "Nos analyses propulsées par l'IA révèlent les prochaines tendances avant qu'elles n'explosent."
        },
        {
          title: "Réseau de fournisseurs vérifiés",
          desc: "Échangez en toute confiance. Chaque fournisseur sur Nexusply est rigoureusement contrôlé."
        },
        {
          title: "Intelligence de marché d'élite",
          desc: "Décisions basées sur les données pour les importateurs modernes et les entrepreneurs e-commerce."
        }
      ],
      cta: {
        getStarted: "Commencer gratuitement",
        learnMore: "En savoir plus"
      }
    },
    hero: {
      intro: "Présentation de Nexusply Intelligence",
      title: "Le futur de l'intelligence fournisseur :",
      subtitle: "Données & Profit Combinés",
      description: "Découvrez des fournisseurs gagnants, optimisez vos marges et développez votre entreprise grâce à des analyses propulsées par l'IA et des données de marché en temps réel.",
      explore: "Explorer les fonctionnalités",
      getStarted: "Commencer gratuitement"
    },
    features: {
      badge: "Fonctionnalités de la plateforme",
      title: "Le centre de",
      highlight: "Commande Fournisseur Complet",
      description: "Tout ce dont vous avez besoin pour découvrir, analyser et dominer les marchés de fournisseurs.",
      items: {
        discovery: {
          title: "Moteur de découverte de fournisseurs",
          desc: "Trouvez les meilleurs fournisseurs du monde entier grâce à un filtrage intelligent par IA, un classement et un ciblage de niche."
        },
        profiles: {
          title: "Profils des fournisseurs",
          desc: "Accédez à des données détaillées sur les fournisseurs, notamment les niveaux de prix, les délais de livraison, les avis et les scores de fiabilité."
        },
        winning: {
          title: "Produits gagnants",
          desc: "Identifiez les produits tendance à forte demande avec de solides marges en utilisant des données en temps réel."
        },
        comparison: {
          title: "Comparaison de prix",
          desc: "Comparez instantanément les prix des fournisseurs, les frais d'expédition et les marges bénéficiaires entre plusieurs vendeurs."
        },
        simulator: {
          title: "Simulateur de profit",
          desc: "Calculez le ROI, les points mort et les marges bénéficiaires avant de prendre vos décisions d'approvisionnement."
        },
        affiliate: {
          title: "Système d'affiliation et de partenariat",
          desc: "Monétisez votre réseau avec des liens de parrainage, des commissions et des analyses avancées des partenaires."
        },
        advisor: {
          title: "Conseiller fournisseur IA",
          desc: "Obtenez des recommandations intelligentes basées sur votre budget, votre niche et votre marché cible."
        },
        autosourcing: {
          title: "Mode Auto Sourcing",
          desc: "Décrivez un produit et laissez l'IA trouver, comparer et recommander instantanément les meilleurs fournisseurs."
        },
        trust: {
          title: "Score de confiance et de risque",
          desc: "Évitez les fournisseurs peu fiables grâce à la détection de fraude par l'IA et au score de confiance."
        }
      }
    },
    about: {
      badge: "À propos de Nexusply",
      title: "Redéfinir",
      highlight: "l'intelligence fournisseur",
      description1: "Nexusply is a next-generation supplier intelligence platform built to help entrepreneurs discover high-performing suppliers, identify winning products, and maximize profit margins using AI-driven insights.",
      description2: "Instead of guessing, you operate with data. Instead of testing blindly, you execute with precision.",
      stats: {
        suppliers: {
          value: "10K+",
          label: "Suppliers analyzed"
        },
        profit: {
          value: "+45%",
          label: "Avg profit increase"
        },
        ai: {
          value: "AI",
          label: "Smart sourcing engine"
        },
        global: {
          value: "Global",
          label: "Supplier network"
        }
      }
    },
    howItWorks: {
      title: "How Nexusply",
      highlight: "Fonctionne",
      description: "Nous avons simplifié le monde complexe du sourcing mondial en un processus rationalisé en 4 étapes, alimenté par l'intelligence des données avancée.",
      step1: {
        title: "1. Connectez les sources de données",
        desc: "Nexusply agrège les données en direct des places de marché mondiales comme Alibaba, 1688 et CJ Dropshipping, vous offrant un tableau de bord unifié."
      },
      step2: {
        title: "2. Analyser et comparer",
        desc: "Utilisez notre moteur d'IA pour comparer instantanément les MOQ, les délais de livraison et les scores de fiabilité de milliers de fabricants vérifiés."
      },
      step3: {
        title: "3. Identifier les gagnants",
        desc: "Notre simulateur de profit calcule les marges réelles, vous aidant à repérer les produits tendance avec une forte demande et une faible concurrence."
      },
      step4: {
        title: "4. Développer avec l'IA",
        desc: "Recevez des recommandations quotidiennes basées sur l'IA sur les niveaux de stock, les ajustements de prix et les nouvelles opportunités de sourcing pour dominer votre niche."
      }
    },
    pricing: {
      title: "Tarifs",
      plans: {
        basic: {
          title: "Plan Explorateur",
          price: "1 700 FCFA",
          features: [
            "Téléphones entrée/milieu de gamme",
            "Accès tablettes & ordinateurs",
            "Calculatrice basique",
            "1 produit gagnant/mois (48h délai)",
            "Fournisseurs plateformes (Alibaba, 1688...)",
            "Canal WhatsApp communauté"
          ],
          cta: "Commencer"
        },
        standard: {
          title: "Plan Importateur",
          price: "2 900 FCFA",
          features: [
            "Toutes marques + pliables",
            "Tablettes toutes marques",
            "MacBook & PC Gaming entrée de gamme",
            "Calculatrice complète (CBM + marge)",
            "Produits gagnants en temps réel",
            "Fournisseurs + contacts directs",
            "Canal WhatsApp communauté"
          ],
          cta: "Commencer"
        },
        premium: {
          title: "Plan Partenaire",
          price: "4 000 FCFA",
          features: [
            "Dernières sorties + nouveautés annonce",
            "Tablettes dernières générations",
            "MacBook & Gaming haut de gamme",
            "Calculatrice full (+ estimation pub)",
            "Produits gagnants avant-première",
            "Tous les fournisseurs + accès prioritaire",
            "Canal WhatsApp prioritaire"
          ],
          cta: "Commencer"
        }
      }
    },
    footer: {
      cta: {
        title: "Continuez votre",
        highlight: "succès",
        description: "Rejoignez des milliers d'entrepreneurs utilisant Nexusply pour trouver des fournisseurs gagnants et maximiser leurs profits.",
        placeholder: "votre@email.com",
        button: "Commencer",
        note: "Pas de spam. Uniquement des informations précieuses."
      },
      brand: {
        desc: "Transformer les données fournisseurs en décisions profitables."
      },
      sections: {
        product: "Produit",
        resources: "Ressources",
        company: "Entreprise",
        support: "Support"
      },
      links: {
        dashboard: "Tableau de bord",
        winningProducts: "Produits gagnants",
        aiInsights: "Analyses IA",
        features: "Fonctionnalités",
        pricing: "Tarifs",
        howItWorks: "Comment ça marche",
        about: "À propos",
        terms: "Conditions",
        privacy: "Confidentialité",
        helpCenter: "Centre d'aide",
        contactUs: "Contactez-nous"
      },
      bottom: {
        rights: "© 2026 Nexusply. Tous droits réservés.",
        privacy: "Confidentialité",
        terms: "Conditions",
        security: "Sécurité"
      }
    },
    auth: {
      agreeTerms: "J'accepte les Conditions d'Utilisation et la Politique de Confidentialité",
      mustAgree: "Vous devez accepter les Conditions d'Utilisation et la Politique de Confidentialité",
      loginTitle: "Bon retour",
      loginSubtitle: "Entrez vos identifiants pour accéder à Nexusply",
      emailLabel: "E-mail",
      passwordLabel: "Mot de passe",
      confirmPasswordLabel: "Confirmer le mot de passe",
      loginButton: "Se connecter",
      loggingIn: "Connexion...",
      noAccount: "Vous n'avez pas de compte ?",
      signupLink: "S'inscrire",
      signupTitle: "Créer un compte",
      signupSubtitle: "Commencez à optimiser votre stratégie fournisseur dès aujourd'hui",
      signupButton: "Démarrer",
      signingUp: "Création du compte...",
      hasAccount: "Vous avez déjà un compte ?",
      loginLink: "Connexion",
      allFieldsRequired: "Tous les champs sont obligatoires",
      passwordsDoNotMatch: "Les mots de passe ne correspondent pas",
      checkEmail: "Vérifiez vos e-mails pour confirmer votre compte",
      loginSuccess: "Connexion réussie",
      signupSuccess: "Compte créé avec succès",
      panelTitle: "Accédez à votre centre de commande fournisseur",
      panelDesc: "Découvrez, comparez et optimisez vos décisions de sourcing avec précision.",
    },
    policies: {
      privacy: {
        title: "Politique de Confidentialité",
        lastUpdated: "Dernière mise à jour : Juin 2026",
        intro: "Chez Nexusply, nous prenons votre vie privée au sérieux. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.",
        sections: [
          {
            title: "1. Informations que nous collectons",
            content: "Nous collectons les informations que vous nous fournissez directement lorsque vous créez un compte, telles que votre nom, votre adresse e-mail et vos informations de paiement. Nous collectons également des données d'utilisation pour améliorer nos services."
          },
          {
            title: "2. Comment nous utilisons vos informations",
            content: "Nous utilisons vos informations pour fournir et maintenir nos services, traiter les transactions et communiquer avec vous au sujet des mises à jour ou des offres promotionnelles."
          },
          {
            title: "3. Sécurité des données",
            content: "Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie pour protéger vos données. Cependant, aucune méthode de transmission sur Internet n'est sûre à 100 %."
          },
          {
            title: "4. Vos droits",
            content: "Vous avez le droit d'accéder, de corriger ou de supprimer vos informations personnelles à tout moment via les paramètres de votre compte."
          }
        ]
      },
      terms: {
        title: "Conditions d'Utilisation",
        lastUpdated: "Dernière mise à jour : Juin 2026",
        intro: "En utilisant Nexusply, vous acceptez ces conditions. Veuillez les lire attentivement.",
        sections: [
          {
            title: "1. Acceptation des conditions",
            content: "En accédant à notre plateforme ou en l'utilisant, vous acceptez d'être lié par ces Conditions d'Utilisation et par toutes les lois et réglementations applicables."
          },
          {
            title: "2. User Accounts",
            content: "Vous êtes responsable du maintien de la confidentialité de votre compte and de votre mot de passe. Vous devez avoir au moins 18 ans pour utiliser nos services."
          },
          {
            title: "3. Abonnement et facturation",
            content: "Certaines fonctionnalités nécessitent un abonnement payant. Tous les frais sont non remboursables, sauf si la loi l'exige."
          },
          {
            title: "4. Conduite interdite",
            content: "Vous acceptez de ne pas utiliser la plateforme à des fins illégales ou d'une manière qui pourrait endommager ou altérer nos services."
          }
        ]
      }
    },
  },
  CN: {
    common: {
      search: "搜索",
      filter: "筛选",
      close: "关闭",
      back: "返回",
      loading: "加载中...",
      upgrade: "升级",
      hot: "热门",
      recommended: "推荐",
      loadMore: "加载更多供应商",
      sortBy: "排序方式",
      results: "结果",
      justNow: "刚刚",
      daysAgo: "天前",
      weekAgo: "周前",
      month: "月",
      free: "免费",
      active: "激活",
      unavailable: "不可用",
    },
    navbar: {
      home: "首页",
      winning: "爆款产品",
      support: "支持",
      profile: "个人资料",
      features: "功能介绍",
      pricing: "价格方案",
      about: "关于我们",
      login: "登录",
      getStarted: "开始体验",
      training: "培训",
    },
    dashboard: {
      title: "供应商情报",
      subtitle: "发现爆款产品，分析利润空间，并立即与优质、经过验证的制造商建立联系。",
      stats: {
        suppliers: "供应商总数",
        favorites: "收藏夹",
        avgMoq: "平台平均起订量",
        topCategory: "热门类目",
      },
      upgrade: "升级方案",
      searchPlaceholder: "搜索类目、产品 or 供应商名称...",
      discoveryGrid: "发现网格",
      lockedTitle: "直接联系方式已锁定",
      lockedDesc: "升级到进口商方案以解锁制造商的电话号码和微信 ID。",
      lockedSupplier: "已锁定的供应商",
      lockedSupplierDesc: "升级以查看优质直接联系方式和制造商。",
    },
    supplier: {
      moq: "起订量",
      category: "类目",
      contact: "联系供应商",
      units: "件",
      verified: "验证供应商",
      fastFulfillment: "快速履约",
      trending: "热门供应商",
      factoryAccess: "直接工厂访问",
      premiumOnly: "仅限高级版",
      unlockAccess: "解锁制造商直接访问",
      unlockDesc: "跳过平台费用。获取包括 WhatsApp、微信和私人内存在内的直接联系方式，以获得更好的价格。",
      aiInsights: "Nexus AI 深度见解",
      profitScore: "利润评分",
      estMargin: "预计利润率",
      reliability: "可靠性",
      delivery: "物流时效",
      excellent: "优秀",
      aboveAverage: "高于平均水平",
      highReliability: "高",
      successRate: "成功率",
      globalAvg: "全球平均",
      ratings: "评分与可靠性",
      basedOn: "基于",
      reviews: "条评论",
      readyToSource: "准备好采购了吗？",
      readyDesc: "直接联系以协商价格并索取样品。",
      minOrder: "最小起订量",
      rateExperience: "评价您的体验",
      ratePlaceholder: "产品质量和发货时间如何？",
      submitReview: "提交评论",
      similarSuppliers: "相似供应商",
      viewDetails: "查看详情",
      backToResults: "返回结果",
      communityFeed: "社区动态",
      noReviews: "暂无评论。抢先分享您的体验吧！",
      anonymous: "匿名",
      upgradeToPartner: "升级到合伙人方案",
      whatsappPhone: "WhatsApp / 电话",
      wechatId: "微信 ID",
      enterpriseEmail: "企业邮箱",
    },
    product: {
      backToProducts: "返回产品列表",
      demandLevel: "需求",
      viewMatchingSuppliers: "查看匹配的供应商",
      intelligenceCore: "智能核心",
      profitScore: "利润评分",
      marketTrend: "市场趋势",
      competition: "竞争程度",
      low: "低",
      avgDelivery: "平均时效",
      verifiedSuppliers: "经过验证的供应商",
      noSuppliers: "该产品类别暂无经过验证的供应商。",
      sourceThisProduct: "采购此产品",
      sourceThisProductDesc: "立即与经过验证的供应商联系，索取样品并洽谈批量价格。",
      beginSourcing: "开始采购流程",
      communityInsights: "社区见解",
      addInsight: "添加您的见解",
      insightPlaceholder: "分享您的采购经验...",
      submitInsight: "提交见解",
      productNotFound: "未找到产品",
      browseAllProducts: "浏览所有产品",
      tryAgain: "重试",
    },
    search: {
      placeholder: "搜索供应商、产品...",
      recent: "最近搜索",
      suggestions: "建议",
      noResults: "未找到相关结果",
    },
    training: {
      title: "培训中心",
      subtitle: "专家主导的采购培训：文档、视频和指南，助您扩展进口业务。",
      partnerOnly: "合伙人专属",
      document: "文档",
      video: "视频",
      link: "链接",
      download: "下载",
      watch: "观看",
      open: "打开",
      duration: "时长",
      minutes: "分钟",
      emptyTitle: "暂无已发布的培训",
      emptyDesc: "全新的专家培训模块即将上线，您将第一时间获知。",
      lockedTitle: "培训内容已锁定",
      lockedDesc: "培训中心仅限合伙人方案——我们的最高等级。升级即可解锁专家文档、视频和指南。",
      back: "返回培训列表",
      openOriginal: "打开原始链接",
      playlist: "播放列表",
      nowPlaying: "正在播放",
      upNext: "下一个",
      addVideos: "添加视频",
      videosCount: "个视频",
    },
    profile: {
      contacts: "已联系的供应商",
      contacted: "已联系",
      favoritesProducts: "收藏的产品",
      favoritesSuppliers: "收藏的供应商",
      settings: "账户设置",
      plan: "订阅与账单",
      subtitle: "管理您的偏好和平台数据。",
      activity: "活动",
      logout: "登出",
      notLoggedIn: "请登录以查看您的个人资料",
      login: "登录",
      emptyContacts: "您还没有联系过任何供应商。",
      emptyFavProducts: "您还没有保存过任何爆款产品。",
      emptyFavSuppliers: "还没有收藏的供应商。开始采购吧！",
      currentPlan: "当前有效方案",
      trialEnds: "试用结束",
      mostPopular: "最受欢迎",
      currentPlanBtn: "当前方案",
      upgradeTo: "升级到",
    },
    settings: {
      account: "账户",
      language: "语言",
      notifications: "通知",
      currency: "货币",
      localization: "本地化",
      alerts: "警报与通知",
      username: "用户名",
      email: "电子邮件地址",
      role: "角色",
      push: "推送通知",
    },
    subscription: {
      trialExpired: "试用期已过",
      trialExpiredDesc: "您的 14 天试用期已结束。请订阅方案以继续访问 Nexusply。",
      choosePlan: "选择您的方案",
      manageSubscription: "管理订阅",
      backToHome: "返回首页",
      redirecting: "正在跳转到安全支付页面...",
      checkoutError: "无法发起支付，请重试。",
      confirming: "正在确认您的付款...",
      confirmed: "付款成功！您的方案有效期至",
      processing: "您的付款仍在处理中，方案将在几分钟内自动激活。",
      failed: "付款未成功，您可以随时重试。",
      mismatch: "我们无法验证此付款。如已扣款，请联系客服。",
      tryAgain: "重试",
      renew: "续订（+30 天）",
      expiresIn: "剩余有效期",
      payFrom: "付款国家",
    },
    featureUi: {
      "lockedLabel": "功能已锁定",
      "seePlans": "查看方案",
      "winning": {
        "eyebrow": "爆款产品",
        "searchPlaceholder": "按细分市场、名称或类别搜索…",
        "topFive": "前五名",
        "topResults": "最佳结果",
        "emerging": "新兴机会",
        "noProducts": "没有符合搜索条件的产品。",
        "delayNote": "您的方案会延迟 {h} 小时显示新品。升级到进口商方案即可立即查看。",
        "lockedTitle": "爆款产品已锁定",
        "lockedDesc": "您的 {plan} 方案不包含爆款产品。升级即可发现实时更新的高利润产品。",
        "unlockMoreTitle": "解锁 {n}+ 个爆款产品",
        "unlockMoreDesc": "您在 {plan} 方案下只能看到部分产品。升级即可访问完整数据库。",
        "lockedProduct": "产品已锁定",
        "lockedProductDesc": "升级方案即可查看此产品。",
        "trending": "热门"
      },
      "product": {
        "eyebrow": "产品",
        "insightsLabel": "分析",
        "suppliersLabel": "供应商",
        "sourcingLabel": "采购",
        "reviewsLabel": "评价"
      },
      "calculator": {
        "title": "利润模拟器",
        "plan": "方案",
        "buyPrice": "采购价",
        "sellPrice": "售价",
        "shipping": "运费（总计）",
        "weight": "重量（公斤）",
        "cbm": "体积（CBM）",
        "adSpend": "预估广告费",
        "netProfit": "预估净利润",
        "roi": "投资回报率",
        "lockedNote": "升级到进口商方案即可解锁运费、体积和净利润计算。",
        "lockedBadge": "进口商+"
      },
      "training": {
        "eyebrow": "培训中心"
      }
    },
    dashboardUi: {
      "eyebrow": "仪表盘",
      "searchResults": "搜索结果",
      "noSuppliers": "没有符合条件的供应商。",
      "clearSearch": "清除搜索",
      "filters": "筛选",
      "reset": "重置",
      "quickFilters": "快速筛选",
      "verifiedOnly": "仅认证供应商",
      "primaryCategory": "主要类别",
      "subCategory": "子类别",
      "selectCategoryFirst": "请先选择类别",
      "applyFilters": "应用筛选",
      "categories": {
        "Electronics": "电子产品",
        "Clothing": "服装",
        "Home": "家居",
        "Beauty": "美妆"
      },
      "recommendedForYou": "为您推荐",
      "suggestedSuppliers": "推荐供应商",
      "suggestedLabel": "精选",
      "unlockTitle": "解锁全部供应商",
      "unlockDesc": "您在 {plan} 方案下只能看到部分供应商。升级即可访问完整网络。",
      "upgradeNow": "查看方案",
      "supplier": {
        "overview": "概览",
        "contactLabel": "联系",
        "portfolioLabel": "产品目录",
        "portfolioTitle": "供应产品",
        "insightsLabel": "分析",
        "reviewsLabel": "评价",
        "rating": "评分",
        "reviewCount": "评价",
        "days": "天",
        "noDirectContact": "未找到直接联系方式。请使用平台联系链接。"
      }
    },
    landing: {
      "nav": {
        "product": "产品",
        "solutions": "解决方案",
        "ai": "Nexus AI",
        "pricing": "价格",
        "faq": "常见问题",
        "login": "登录",
        "start": "开始使用"
      },
      "announce": {
        "tag": "新",
        "text": "15 个国家支持移动支付"
      },
      "hero": {
        "title": "您的智能进口助手",
        "subtitle": "寻找经过验证的供应商，发现爆款产品，在购买前了解您的利润。一站式完成。",
        "primary": "免费开始",
        "secondary": "查看价格",
        "scroll": "向下滚动"
      },
      "intro": {
        "label": "重新定义进口",
        "title": "更快进口，更低风险",
        "desc": "Nexusply 用清晰的数据取代数小时的调研，让您以合适的价格采购，并以真实的利润转售。",
        "stats": [
          {
            "value": "10K+",
            "label": "已分析供应商"
          },
          {
            "value": "+45%",
            "label": "平均利润提升"
          },
          {
            "value": "15",
            "label": "支持移动支付的国家"
          }
        ]
      },
      "product": {
        "label": "产品",
        "title": "为行动迅速的进口商打造",
        "desc": "三大工具，覆盖从供应商到转售的全流程。",
        "learnMore": "了解更多",
        "items": [
          {
            "tab": "认证供应商",
            "title": "可靠的供应商，无需猜测",
            "desc": "阿里巴巴、1688 等平台每个供应商的价格、交期、起订量、评价和可靠性评分。",
            "metric": "10K+",
            "metricLabel": "已分析供应商"
          },
          {
            "tab": "爆款产品",
            "title": "抢先发现趋势",
            "desc": "高需求、低竞争的产品，持续更新，并附带转售潜力。",
            "metric": "0 小时",
            "metricLabel": "进口商方案的新品延迟"
          },
          {
            "tab": "利润计算器",
            "title": "购买前了解您的利润",
            "desc": "采购价、运费、体积和费用：计算器给出真实利润和建议售价。",
            "metric": "+45%",
            "metricLabel": "平均利润"
          }
        ]
      },
      "solutions": {
        "label": "解决方案",
        "title": "适合您的销售方式",
        "desc": "无论您是测试第一个产品还是周转库存，Nexusply 都能跟上您的节奏。",
        "items": [
          {
            "tab": "新手",
            "desc": "小预算测试市场：主流平台供应商、基础计算器，每月一个爆款产品。",
            "metric": "30 天",
            "metricLabel": "每次付款的使用期，无需绑定"
          },
          {
            "tab": "进口商",
            "desc": "所有品牌、平板和电脑、供应商直接联系方式以及实时爆款产品。",
            "metric": "CBM",
            "metricLabel": "完整的运费和利润计算"
          },
          {
            "tab": "经销商",
            "desc": "抢先获取最新产品、全部供应商、优先权限和培训中心。",
            "metric": "优先",
            "metricLabel": "支持与新品抢先体验"
          },
          {
            "tab": "电商",
            "desc": "比较不同卖家的价格，估算广告预算，在一个仪表盘中跟踪收藏。",
            "metric": "1",
            "metricLabel": "个仪表盘掌控一切"
          }
        ]
      },
      "ai": {
        "label": "Nexus AI",
        "title": "提出问题，获得有数据支撑的答案",
        "desc": "您的采购顾问会分析您的预算、细分市场和目标市场，推荐买什么以及在哪里买。",
        "points": [
          "发现细分市场的热门产品",
          "比较同一产品的供应商",
          "下单前估算利润"
        ],
        "cta": "立即试用"
      },
      "steps": {
        "label": "如何运作",
        "title": "四步从想法到下单",
        "items": [
          {
            "title": "选择细分市场",
            "desc": "手机、平板、电脑：按类别、预算和目标市场筛选。"
          },
          {
            "title": "比较供应商",
            "desc": "价格、起订量、交期和可靠性评分，一目了然。"
          },
          {
            "title": "计算利润",
            "desc": "加入运费和费用：购买前看到真实利润。"
          },
          {
            "title": "下单并转售",
            "desc": "直接联系供应商，跟踪趋势，在合适的时机补货。"
          }
        ]
      },
      "band": {
        "quote": "以合适的价格采购，以真实的利润转售。",
        "caption": "Nexusply，为非洲打造的供应商情报平台"
      },
      "pricing": {
        "label": "价格",
        "title": "简单的价格，移动支付",
        "desc": "每次付款可使用 30 天。没有自动续费：随时续订。",
        "popular": "最受欢迎",
        "perMonth": "/ 30 天"
      },
      "faq": {
        "label": "常见问题",
        "title": "为您解答",
        "items": [
          {
            "q": "如何付款？",
            "a": "通过我们的安全支付合作伙伴 SasPay，使用移动支付或银行卡。在价格上方选择您的国家，即可查看本币价格。"
          },
          {
            "q": "会自动续费吗？",
            "a": "不会。每次付款可使用 30 天。您可以随时续订，不会自动扣款。"
          },
          {
            "q": "可以更换方案吗？",
            "a": "可以，随时都行。如果在使用期内更换方案，剩余时间会被折算并加到新方案中。"
          },
          {
            "q": "哪些国家可以付款？",
            "a": "目前：喀麦隆、加蓬、刚果、科特迪瓦、塞内加尔、贝宁、多哥、布基纳法索、马里、尼日尔、刚果（金）、尼日利亚、加纳、几内亚和塞拉利昂。更多国家即将开通。"
          },
          {
            "q": "付款前可以先体验吗？",
            "a": "可以。创建免费账户来体验 Nexusply，准备好后再选择方案。"
          },
          {
            "q": "供应商经过验证吗？",
            "a": "每个供应商都会显示价格、交期、起订量、评价和可靠性评分，帮助您避开高风险卖家。"
          }
        ]
      },
      "cta": {
        "label": "开始使用",
        "title": "加入更聪明采购的进口商",
        "desc": "一分钟创建账户。准备好后再选择方案。",
        "primary": "免费开始",
        "secondary": "登录"
      },
      "footer": {
        "tagline": "将供应商数据转化为盈利决策。",
        "product": "产品",
        "company": "公司",
        "legal": "法律",
        "features": "功能",
        "solutions": "解决方案",
        "pricing": "价格",
        "faq": "常见问题",
        "dashboard": "仪表盘",
        "support": "帮助中心",
        "contact": "联系我们",
        "terms": "条款",
        "privacy": "隐私",
        "rights": "© 2026 Nexusply。保留所有权利。"
      }
    },
    heroCarousel: {
      intro: "Nexusply 情报",
      slides: [
        {
          title: "全球采购 简化流程",
          desc: "只需点击几下，即可与全球最可靠的制造商建立联系。"
        },
        {
          title: "发现 爆款产品",
          desc: "我们的 AI 深度见解在市场趋势爆发前揭示先机。"
        },
        {
          title: "经过验证的 供应商网络",
          desc: "放心交易。Nexusply 上的每位供应商都经过严格的质量审核。"
        },
        {
          title: "精英级 市场情报",
          desc: "为现代进口商和电子商务创业者提供数据驱动的决策支持。"
        }
      ],
      cta: {
        getStarted: "免费开始使用",
        learnMore: "了解更多"
      }
    },
    hero: {
      intro: "Introducing Nexusply Intelligence",
      title: "The Future of Supplier Intelligence:",
      subtitle: "Data & Profit Combined",
      description: "Discover winning suppliers, optimize margins, and scale your business with AI-powered insights and real-time market data.",
      explore: "Explore Features",
      getStarted: "Get Started Free"
    },
    features: {
      badge: "Platform Features",
      title: "The Complete",
      highlight: "Supplier Command Center",
      description: "Everything you need to discover, analyze, and dominate supplier markets.",
      items: {
        discovery: {
          title: "Supplier Discovery Engine",
          desc: "Find the best suppliers worldwide with smart AI-powered filtering, ranking, and niche targeting."
        },
        profiles: {
          title: "Supplier Profiles",
          desc: "Access detailed supplier data including pricing tiers, delivery times, reviews, and reliability scores."
        },
        winning: {
          title: "Winning Products",
          desc: "Identify trending, high-demand products with strong margins using real-time data insights."
        },
        comparison: {
          title: "Price Comparison",
          desc: "Compare supplier pricing, shipping costs, and profit margins instantly across multiple vendors."
        },
        simulator: {
          title: "Profit Simulator",
          desc: "Calculate ROI, break-even points, and profit margins before making sourcing decisions."
        },
        affiliate: {
          title: "Affiliate & Partner System",
          desc: "Monetize your network with referral links, commissions, and advanced partner analytics."
        },
        advisor: {
          title: "AI Supplier Advisor",
          desc: "Get intelligent recommendations based on your budget, niche, and target market."
        },
        autosourcing: {
          title: "Auto Sourcing Mode",
          desc: "Describe a product and let AI find, compare, and recommend the best suppliers instantly."
        },
        trust: {
          title: "Trust & Risk Scoring",
          desc: "Avoid unreliable suppliers with AI-powered fraud detection and trust scoring."
        }
      }
    },
    about: {
      badge: "About Nexusply",
      title: "Redefining",
      highlight: "Supplier Intelligence",
      description1: "Nexusply is a next-generation supplier intelligence platform built to help entrepreneurs discover high-performing suppliers, identify winning products, and maximize profit margins using AI-driven insights.",
      description2: "Instead of guessing, you operate with data. Instead of testing blindly, you execute with precision.",
      stats: {
        suppliers: {
          value: "10K+",
          label: "Suppliers analyzed"
        },
        profit: {
          value: "+45%",
          label: "Avg profit increase"
        },
        ai: {
          value: "AI",
          label: "Smart sourcing engine"
        },
        global: {
          value: "Global",
          label: "Supplier network"
        }
      }
    },
    howItWorks: {
      title: "How Nexusply",
      highlight: "Functions",
      description: "We've simplified the complex world of global sourcing into a streamlined 4-step process powered by advanced data intelligence.",
      step1: {
        title: "1. Connect Data Sources",
        desc: "Nexusply aggregates live data from global marketplaces like Alibaba, 1688, and CJ Dropshipping, providing you with a unified dashboard."
      },
      step2: {
        title: "2. Analyze & Compare",
        desc: "Use our AI engine to compare MOQ, shipping times, and reliability scores across thousands of verified manufacturers instantly."
      },
      step3: {
        title: "3. Identify Winners",
        desc: "Our profit simulator calculates real margins, helping you spot trending products with high demand and low competition."
      },
      step4: {
        title: "4. Scale With AI",
        desc: "Receive daily AI-driven recommendations on stock levels, price adjustments, and new sourcing opportunities to dominate your niche."
      }
    },
    pricing: {
      title: "价格方案",
      plans: {
        basic: {
          title: "探索者方案",
          price: "1,700 FCFA",
          features: [
            "入门级/中端手机",
            "平板电脑和电脑访问",
            "基础计算器",
            "每月1个爆款产品（48小时延迟）",
            "平台供应商 (Alibaba, 1688...)",
            "社群 WhatsApp 频道"
          ],
          cta: "立即开始"
        },
        standard: {
          title: "进口商方案",
          price: "2,900 FCFA",
          features: [
            "所有品牌 + 折叠屏手机",
            "所有平板电脑品牌",
            "MacBook 和入门级游戏电脑",
            "完整计算器 (CBM + 利润)",
            "实时爆款产品",
            "供应商 + 直接联系人",
            "社群 WhatsApp 频道"
          ],
          cta: "立即开始"
        },
        premium: {
          title: "合伙人方案",
          price: "4,000 FCFA",
          features: [
            "最新款 + 即时资讯",
            "最新一代平板电脑",
            "高端 MacBook 和游戏电脑",
            "完整计算器 (+ 广告估算)",
            "预选爆款产品",
            "所有供应商 + 优先访问",
            "优先 WhatsApp 频道"
          ],
          cta: "立即开始"
        }
      }
    },
    footer: {
      cta: {
        title: "Continue Your",
        highlight: "Success Story",
        description: "Join thousands of entrepreneurs using Nexusply to find winning suppliers and maximize profits.",
        placeholder: "your@email.com",
        button: "Get Started",
        note: "No spam. Only valuable insights."
      },
      brand: {
        desc: "Transforming supplier data into profitable decisions."
      },
      sections: {
        product: "Product",
        resources: "Resources",
        company: "Company",
        support: "Support"
      },
      links: {
        dashboard: "Dashboard",
        winningProducts: "Winning Products",
        aiInsights: "AI Insights",
        features: "Features",
        pricing: "Pricing",
        howItWorks: "How it Works",
        about: "About",
        terms: "Terms",
        privacy: "Privacy",
        helpCenter: "Help Center",
        contactUs: "Contact Us"
      },
      bottom: {
        rights: "© 2026 Nexusply. All rights reserved.",
        privacy: "Privacy",
        terms: "Terms",
        security: "Security"
      }
    },
    auth: {
      agreeTerms: "我同意服务条款和隐私政策",
      mustAgree: "您必须同意服务条款和隐私政策",
      loginTitle: "欢迎回来",
      loginSubtitle: "输入您的凭据以访问 Nexusply",
      emailLabel: "电子邮件",
      passwordLabel: "密码",
      confirmPasswordLabel: "确认密码",
      loginButton: "登录",
      loggingIn: "登录中...",
      noAccount: "没有账号？",
      signupLink: "注册",
      signupTitle: "创建账号",
      signupSubtitle: "立即开始优化您的供应商策略",
      signupButton: "立即开始",
      signingUp: "正在创建账号...",
      hasAccount: "已有账号？",
      loginLink: "登录",
      allFieldsRequired: "所有字段均为必填项",
      passwordsDoNotMatch: "密码不匹配",
      checkEmail: "检查您的电子邮件以确认您的账号",
      loginSuccess: "登录成功",
      signupSuccess: "账号创建成功",
      panelTitle: "访问您的供应商指挥中心",
      panelDesc: "精准发现、比较并优化采购决策。",
    },
    policies: {
      privacy: {
        title: "隐私政策",
        lastUpdated: "最后更新：2026年6月",
        intro: "在 Nexusply，我们非常重视您的隐私. 本政策解释了我们如何收集、使用和保护您的个人信息。",
        sections: [
          {
            title: "1. 我们收集的信息",
            content: "当您创建账户时，我们会收集您直接提供给我们的信息，例如您的姓名、电子邮件地址和付款信息。我们还收集使用数据以改进我们的服务。"
          },
          {
            title: "2. 我们如何使用您的信息",
            content: "我们使用您的信息来提供 and 维护我们的服务，处理交易，并向您传达有关更新或促销优惠的信息。"
          },
          {
            title: "3. 数据安全",
            content: "我们实施行业标准的安全措施来保护您的数据。但是，没有任何通过互联网传输的方法是 100% 安全的。"
          },
          {
            title: "4. 您的权利",
            content: "您有权随时通过您的账户设置访问、更正或删除您的个人信息。"
          }
        ]
      },
      terms: {
        title: "服务条款",
        lastUpdated: "最后更新：2026年6月",
        intro: "通过使用 Nexusply，您同意这些条款。请仔细阅读。",
        sections: [
          {
            title: "1. 条款的接受",
            content: "通过访问或使用我们的平台，您同意受这些服务条款以及所有适用法律法规的约束。"
          },
          {
            title: "2. 用户账户",
            content: "您有责任维护您的账户 and 密码的机密性。您必须年满 18 岁才能使用我们的服务。"
          },
          {
            title: "3. 订阅和计费",
            content: "某些功能需要付费订阅。除非法律要求，否则所有费用均不予退还。"
          },
          {
            title: "4. 禁止行为",
            content: "您同意不将平台用于任何非法目的，或以任何可能损害或削弱我们服务的方式使用平台。"
          }
        ]
      }
    },
  },
};

export function useI18n() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    setLang(getLanguage());

    const update = () => setLang(getLanguage());
    window.addEventListener("languageChanged", update);

    return () => window.removeEventListener("languageChanged", update);
  }, []);

  // Keep <html lang> in sync for screen readers, spell-check and search engines.
  useEffect(() => {
    document.documentElement.lang = lang === "CN" ? "zh" : lang.toLowerCase();
  }, [lang]);

  // Use a type cast to ensure the returned translation object matches the structure of the EN translation.
  // This avoids TypeScript errors when accessing properties that are present in all translations but
  // are lost during union type inference of large objects.
  const t = translations[lang] as typeof translations.EN;

  return { t, lang, setLanguage };
}
