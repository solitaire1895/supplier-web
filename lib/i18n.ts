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
    },
    search: {
      placeholder: "Search suppliers, products...",
      recent: "Recent searches",
      suggestions: "Suggestions",
      noResults: "No results found for",
    },
    profile: {
      contacts: "Contacted Suppliers",
      favoritesProducts: "Favorite Products",
      favoritesSuppliers: "Favorite Suppliers",
      settings: "Account Settings",
      plan: "Subscription & Billing",
      subtitle: "Manage your preferences and platform data.",
      activity: "Activity",
      logout: "Logout",
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
          title: "Basic Plan",
          price: "$9.99",
          features: [
            "Access to supplier database",
            "Basic product insights",
            "Favorites & notes",
            "Limited analytics"
          ],
          cta: "Get Started"
        },
        standard: {
          title: "Standard Plan",
          price: "$19.99",
          features: [
            "Full price comparison",
            "Winning products access",
            "Affiliate system (5%)",
            "Advanced filters",
            "AI insights"
          ],
          cta: "Get Started"
        },
        premium: {
          title: "Premium Plan",
          price: "$39.99",
          features: [
            "Partner program (10%)",
            "Advanced analytics",
            "AI negotiation assistant",
            "Bulk comparison",
            "Private suppliers"
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
    }
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
    },
    search: {
      placeholder: "Rechercher fournisseurs, produits...",
      recent: "Recherches récentes",
      suggestions: "Suggestions",
      noResults: "Aucun résultat trouvé pour",
    },
    profile: {
      contacts: "Fournisseurs contactés",
      favoritesProducts: "Produits favoris",
      favoritesSuppliers: "Fournisseurs favoris",
      settings: "Paramètres du compte",
      plan: "Abonnement et facturation",
      subtitle: "Gérez vos préférences et vos données.",
      activity: "Activité",
      logout: "Déconnexion",
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
      description1: "Nexusply est une plateforme d'intelligence fournisseur de nouvelle génération conçue pour aider les entrepreneurs à découvrir des fournisseurs performants, identifier des produits gagnants et maximiser les marges bénéficiaires grâce à des analyses basées sur l'IA.",
      description2: "Au lieu de deviner, vous opérez avec des données. Au lieu de tester à l'aveugle, vous exécutez avec précision.",
      stats: {
        suppliers: {
          value: "10K+",
          label: "Fournisseurs analysés"
        },
        profit: {
          value: "+45%",
          label: "Augmentation moyenne du profit"
        },
        ai: {
          value: "IA",
          label: "Moteur de sourcing intelligent"
        },
        global: {
          value: "Global",
          label: "Réseau de fournisseurs"
        }
      }
    },
    howItWorks: {
      title: "Comment Nexusply",
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
          title: "Plan Basique",
          price: "9,99 $",
          features: [
            "Accès à la base de données fournisseurs",
            "Aperçus de base sur les produits",
            "Favoris et notes",
            "Analyses limitées"
          ],
          cta: "Commencer"
        },
        standard: {
          title: "Plan Standard",
          price: "19,99 $",
          features: [
            "Comparaison complète des prix",
            "Accès aux produits gagnants",
            "Système d'affiliation (5 %)",
            "Filtres avancés",
            "Analyses par l'IA"
          ],
          cta: "Commencer"
        },
        premium: {
          title: "Plan Premium",
          price: "39,99 $",
          features: [
            "Programme partenaire (10 %)",
            "Analyses avancées",
            "Assistant de négociation par IA",
            "Comparaison en masse",
            "Fournisseurs privés"
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
    }
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
      searchPlaceholder: "搜索类目、产品或供应商名称...",
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
    },
    search: {
      placeholder: "搜索供应商、产品...",
      recent: "最近搜索",
      suggestions: "建议",
      noResults: "未找到相关结果",
    },
    profile: {
      contacts: "已联系的供应商",
      favoritesProducts: "收藏的产品",
      favoritesSuppliers: "收藏的供应商",
      settings: "账户设置",
      plan: "订阅与账单",
      subtitle: "管理您的偏好和平台数据。",
      activity: "活动",
      logout: "登出",
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
          title: "基础版",
          price: "$9.99",
          features: [
            "访问供应商数据库",
            "基础产品见解",
            "收藏夹和笔记",
            "有限的数据分析"
          ],
          cta: "立即开始"
        },
        standard: {
          title: "标准版",
          price: "$19.99",
          features: [
            "全方位价格对比",
            "获取爆款产品信息",
            "联盟系统 (5%)",
            "高级筛选器",
            "AI 深度见解"
          ],
          cta: "立即开始"
        },
        premium: {
          title: "高级版",
          price: "$39.99",
          features: [
            "合作伙伴计划 (10%)",
            "高级数据分析",
            "AI 谈判助手",
            "批量价格对比",
            "私有供应商资源"
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
    }
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

  return { t: translations[lang], lang, setLanguage };
}
