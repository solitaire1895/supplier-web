"use client";

import { useState, useEffect } from "react";

export type Lang = "EN" | "FR" | "CN";

const KEY = "nexusply_settings";

export function getLanguage(): Lang {
  if (typeof window === "undefined") return "EN";

  const data = localStorage.getItem(KEY);
  if (!data) return "EN";

  try {
    const settings = JSON.parse(data);
    return settings.language || "EN";
  } catch (e) {
    return "EN";
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
      profile: "Profile",
      features: "Features",
      pricing: "Pricing",
      about: "About",
      login: "Login",
      getStarted: "Get Started",
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
      profile: "Profil",
      features: "Fonctionnalités",
      pricing: "Tarifs",
      about: "À propos",
      login: "Connexion",
      getStarted: "Démarrer",
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
      profile: "个人资料",
      features: "功能介绍",
      pricing: "价格方案",
      about: "关于我们",
      login: "登录",
      getStarted: "开始体验",
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
  const [lang, setLang] = useState<Lang>("EN");

  useEffect(() => {
    setLang(getLanguage());

    const update = () => setLang(getLanguage());
    window.addEventListener("languageChanged", update);

    return () => window.removeEventListener("languageChanged", update);
  }, []);

  // Use a type cast to ensure the returned translation object matches the structure of the EN translation.
  // This avoids TypeScript errors when accessing properties that are present in all translations but
  // are lost during union type inference of large objects.
  const t = translations[lang] as typeof translations.EN;

  return { t, lang, setLanguage };
}
