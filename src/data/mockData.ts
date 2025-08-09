export const mockStartups = [
  {
    id: "1",
    name: "CryptoLend MX",
    description: "Plataforma de préstamos descentralizados que permite a usuarios mexicanos acceder a crédito usando crypto como colateral, con tasas competitivas y sin intermediarios bancarios tradicionales.",
    foundedYear: 2022,
    founders: ["María González", "Carlos Ruiz", "Ana López"],
    website: "https://cryptolend.mx",
    tvl: "$2.3M",
    users: "1,200",
    tags: ["DeFi", "Lending", "Collateral"],
    longDescription: "CryptoLend MX revoluciona el acceso al crédito en México mediante una plataforma descentralizada que elimina intermediarios tradicionales. Los usuarios pueden obtener préstamos instantáneos usando sus criptomonedas como garantía, con tasas de interés competitivas determinadas algorítmicamente. La plataforma soporta múltiples tipos de colateral incluyendo BTC, ETH y tokens ERC-20, ofreciendo flexibilidad tanto a prestamistas como prestatarios. Con smart contracts auditados y un sistema de liquidación automática, CryptoLend MX garantiza la seguridad de los fondos mientras democratiza el acceso al capital financiero.",
    socialLinks: {
      twitter: "https://twitter.com/cryptolendmx",
      linkedin: "https://linkedin.com/company/cryptolendmx",
      telegram: "https://t.me/cryptolendmx"
    },
    metrics: {
      totalLoans: "450",
      avgLoanSize: "$5,200",
      liquidationRate: "2.3%"
    }
  },
  {
    id: "2", 
    name: "AztecSwap",
    description: "DEX automatizado que facilita el intercambio de tokens con pools de liquidez optimizados para el mercado mexicano, incluyendo pares MXN-crypto únicos.",
    foundedYear: 2023,
    founders: ["Roberto Hernández", "Sofía Martínez"],
    website: "https://aztecswap.io",
    tvl: "$850K",
    users: "850",
    tags: ["DEX", "AMM", "Liquidity"],
    longDescription: "AztecSwap es el primer DEX automatizado diseñado específicamente para el mercado mexicano. Utiliza un modelo de Market Maker Automatizado (AMM) que optimiza la liquidez para pares de trading únicos como MXN/ETH, MXN/BTC y otros tokens locales. La plataforma ofrece farming de liquidez con recompensas atractivas, swaps con slippage mínimo y una interfaz intuitiva en español. Los usuarios pueden participar como proveedores de liquidez y ganar fees de transacción, mientras que los traders disfrutan de intercambios instantáneos sin necesidad de libros de órdenes tradicionales.",
    socialLinks: {
      twitter: "https://twitter.com/aztecswap",
      discord: "https://discord.gg/aztecswap"
    },
    metrics: {
      dailyVolume: "$125K",
      totalTrades: "12,450",
      liquidityPairs: "28"
    }
  },
  {
    id: "3",
    name: "PesoStable",
    description: "Stablecoin respaldada por pesos mexicanos que permite pagos DeFi instantáneos y de bajo costo, conectando el peso tradicional con DeFi.",
    foundedYear: 2021,
    founders: ["Diego Morales", "Lucía Fernández", "Manuel Torres", "Carla Jiménez"],
    website: "https://pesostable.com",
    tvl: "$5.7M",
    users: "3,400",
    tags: ["Stablecoin", "Payments", "MXN"],
    longDescription: "PesoStable es la primera stablecoin totalmente respaldada por pesos mexicanos, diseñada para ser el puente entre el sistema financiero tradicional y DeFi. Cada token MXNS está respaldado 1:1 por pesos mexicanos en cuentas bancarias auditadas regularmente. La plataforma permite transferencias instantáneas a costo prácticamente nulo, pagos a comercios, y integración con protocolos DeFi para yield farming y lending. Con licencias regulatorias completas y auditorías mensuales de reservas, PesoStable ofrece la estabilidad del peso con la innovación de blockchain.",
    socialLinks: {
      twitter: "https://twitter.com/pesostable",
      linkedin: "https://linkedin.com/company/pesostable",
      medium: "https://medium.com/@pesostable"
    },
    metrics: {
      circulatingSupply: "5.7M MXNS",
      monthlyTransactions: "45,200",
      merchantPartners: "180"
    }
  },
  {
    id: "4",
    name: "Yield Hacienda",
    description: "Protocolo de yield farming especializado en activos latinos, ofreciendo estrategias automatizadas de inversión para maximizar rendimientos.",
    foundedYear: 2023,
    founders: ["Alejandro Vega", "Patricia Sánchez"],
    website: "https://yieldhacienda.finance",
    tvl: "$1.2M",
    users: "680",
    tags: ["Yield Farming", "Auto-investing", "Strategy"],
    longDescription: "Yield Hacienda automatiza las estrategias de yield farming más rentables del ecosistema DeFi latinoamericano. El protocolo utiliza algoritmos avanzados para reasignar automáticamente los fondos de los usuarios hacia las oportunidades de mayor rendimiento, rebalanceando portfolios y compound de rewards de forma continua. Los usuarios pueden elegir entre diferentes perfiles de riesgo, desde conservadores hasta agresivos, mientras que los smart contracts se encargan de ejecutar las estrategias óptimas. Con integración a múltiples protocolos DeFi y una interfaz simplificada, democratiza el acceso a estrategias de inversión sofisticadas.",
    socialLinks: {
      twitter: "https://twitter.com/yieldhacienda",
      discord: "https://discord.gg/yieldhacienda",
      github: "https://github.com/yieldhacienda"
    },
    metrics: {
      avgAPY: "24.5%",
      strategiesActive: "12",
      totalHarvests: "1,240"
    }
  },
  {
    id: "5",
    name: "MicrDeFi",
    description: "Microfinanzas descentralizadas para pequeños comerciantes mexicanos, democratizando el acceso al capital sin garantías bancarias tradicionales.",
    foundedYear: 2022,
    founders: ["Fernando Castro", "Gabriela Ramos", "Héctor Delgado"],
    website: "https://micrdefi.org",
    tvl: "$680K",
    users: "2,100",
    tags: ["Microfinance", "SME", "Social Impact"],
    longDescription: "MicrDeFi revoluciona las microfinanzas en México mediante tecnología blockchain, ofreciendo préstamos pequeños a comerciantes y emprendedores sin acceso al sistema bancario tradicional. La plataforma utiliza modelos de scoring alternativos basados en datos de comportamiento comercial y social, eliminando la necesidad de garantías físicas. Los prestamistas pueden participar como inversores sociales ganando rendimientos mientras apoyan el desarrollo económico local. Con pagos flexibles, educación financiera integrada y reportes de impacto social transparentes, MicrDeFi construye un ecosistema financiero más inclusivo y sostenible.",
    socialLinks: {
      twitter: "https://twitter.com/micrdefi",
      linkedin: "https://linkedin.com/company/micrdefi"
    },
    metrics: {
      avgLoanSize: "$320",
      repaymentRate: "96.8%",
      businessesSupported: "1,850"
    }
  }
];

export const mockBlogPosts = [
  {
    id: "1",
    title: "El Futuro de DeFi en México: Oportunidades y Desafíos Regulatorios",
    excerpt: "Análisis profundo sobre el panorama regulatorio mexicano para DeFi y las oportunidades de crecimiento en el ecosistema financiero descentralizado nacional.",
    publishedAt: "15 Dic 2024",
    readTime: "8 min",
    category: "Regulación",
    author: "Equipo DeFi México",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&h=300&fit=crop"
  },
  {
    id: "2", 
    title: "Construyendo Bridges: Conectando Peso Mexicano con Blockchain",
    excerpt: "Exploramos las últimas innovaciones en stablecoins respaldadas por MXN y cómo están transformando los pagos digitales en México.",
    publishedAt: "12 Dic 2024",
    readTime: "6 min",
    category: "Tecnología",
    author: "María González",
    image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=500&h=300&fit=crop"
  },
  {
    id: "3",
    title: "Yield Farming en América Latina: Guía Completa para Principiantes",
    excerpt: "Todo lo que necesitas saber sobre yield farming, desde conceptos básicos hasta estrategias avanzadas, con enfoque en el mercado latinoamericano.",
    publishedAt: "10 Dic 2024", 
    readTime: "12 min",
    category: "Educación",
    author: "Carlos Ruiz",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=500&h=300&fit=crop"
  }
];

export const mockEvents = [
  {
    id: "1",
    title: "DeFi México Summit 2024",
    description: "El evento anual más importante del ecosistema DeFi mexicano. Speakers internacionales, startups, workshops y networking.",
    date: "2024-12-20",
    time: "09:00",
    location: "Centro de Convenciones WTC, CDMX",
    type: "Conferencia",
    isUpcoming: true
  },
  {
    id: "2",
    title: "Workshop: Smart Contracts con Solidity",
    description: "Taller práctico para desarrolladores sobre creación de smart contracts seguros para aplicaciones DeFi.",
    date: "2024-12-18",
    time: "14:00", 
    location: "Online",
    type: "Workshop",
    isUpcoming: true
  },
  {
    id: "3",
    title: "Meetup DeFi CDMX - Noviembre",
    description: "Encuentro mensual de la comunidad DeFi en Ciudad de México. Presentaciones de startups locales y networking.",
    date: "2024-11-15",
    time: "18:30",
    location: "WeWork Polanco, CDMX",
    type: "Meetup",
    isUpcoming: false
  }
];

export const mockStats = [
  {
    title: "Startups Registradas",
    value: "47",
    description: "Startups DeFi mexicanas en nuestro ecosistema",
    trend: { value: "12%", isPositive: true }
  },
  {
    title: "Eventos Realizados", 
    value: "23",
    description: "Eventos organizados este año",
    trend: { value: "8%", isPositive: true }
  },
  {
    title: "Miembros Activos",
    value: "2,340",
    description: "Desarrolladores y entusiastas DeFi",
    trend: { value: "15%", isPositive: true }
  },
  {
    title: "TVL Total",
    value: "$12.8M",
    description: "Valor total bloqueado en protocolos mexicanos",
    trend: { value: "23%", isPositive: true }
  }
];