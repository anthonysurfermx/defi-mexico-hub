export const mockStartups = [
  {
    id: "1",
    name: "CryptoLend MX",
    logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&crop=center",
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
    logo: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop&crop=center",
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
    logo: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=100&h=100&fit=crop&crop=center",
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
      circSupply: "5.7M MXNS",
      monthlyTxns: "45,000",
      avgTxnSize: "$127"
    }
  },
  {
    id: "4",
    name: "YieldFarm MX",
    logo: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop&crop=center",
    description: "Protocolo de yield farming optimizado para tokens mexicanos, ofreciendo estrategias automatizadas de inversión DeFi con retornos competitivos.",
    foundedYear: 2022,
    founders: ["Fernando Jiménez", "Isabella Torres"],
    website: "https://yieldfarm.mx",
    tvl: "$1.8M",
    users: "920",
    tags: ["Yield Farming", "Auto-strategies", "DeFi"],
    longDescription: "YieldFarm MX democratiza las estrategias de inversión DeFi complejas mediante protocolos automatizados que optimizan rendimientos para usuarios mexicanos. La plataforma utiliza algoritmos avanzados para rebalancear automáticamente las posiciones entre diferentes protocolos, maximizando el APY mientras minimiza el riesgo. Los usuarios pueden depositar sus tokens y el protocolo se encarga de encontrar las mejores oportunidades de yield en tiempo real, desde lending hasta liquidity providing y staking rewards.",
    socialLinks: {
      twitter: "https://twitter.com/yieldfarm_mx",
      telegram: "https://t.me/yieldfarm_mx",
      github: "https://github.com/yieldfarm-mx"
    },
    metrics: {
      avgAPY: "18.5%",
      totalHarvests: "2,340",
      strategies: "12"
    }
  },
  {
    id: "5",
    name: "BlockRemit",
    logo: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&crop=center",
    description: "Plataforma de remesas descentralizada que conecta México con el mundo, ofreciendo transferencias instantáneas y de bajo costo usando blockchain.",
    foundedYear: 2023,
    founders: ["Miguel Ángel Valdez", "Paola Guerrero", "Andrés Muñoz"],
    website: "https://blockremit.io",
    tvl: "$4.2M",
    users: "2,800",
    tags: ["Remittances", "Cross-border", "Payments"],
    longDescription: "BlockRemit revoluciona el mercado de remesas entre México y Estados Unidos utilizando blockchain para eliminar intermediarios costosos. La plataforma permite enviar dinero de forma instantánea con comisiones hasta 80% menores que los métodos tradicionales. Los usuarios pueden enviar desde USD, EUR o cryptos y el receptor puede recibir en pesos mexicanos directamente en su cuenta bancaria o wallet digital. Con partnerships con casas de cambio locales y compliance regulatorio completo, BlockRemit hace las transferencias internacionales accesibles para millones de familias mexicanas.",
    socialLinks: {
      twitter: "https://twitter.com/blockremit",
      linkedin: "https://linkedin.com/company/blockremit",
      telegram: "https://t.me/blockremit"
    },
    metrics: {
      monthlyVolume: "$4.2M",
      avgSavings: "78%",
      countries: "15"
    }
  }
];

export const mockBlogPosts = [
  {
    id: "1",
    title: "El auge de DeFi en Latinoamérica",
    author: "Elena Rodriguez",
    date: "2024-07-15",
    tags: ["DeFi", "Latinoamérica", "Tendencias"],
    content: "Un análisis del crecimiento exponencial de las finanzas descentralizadas en la región."
  },
  {
    id: "2",
    title: "Cómo las DAOs están transformando la gobernanza",
    author: "Javier Pérez",
    date: "2024-07-10",
    tags: ["DAOs", "Gobernanza", "Blockchain"],
    content: "Exploramos cómo las organizaciones autónomas descentralizadas están revolucionando la toma de decisiones."
  },
  {
    id: "3",
    title: "NFTs: Más allá del arte digital",
    author: "Sofía Mendoza",
    date: "2024-07-05",
    tags: ["NFTs", "Arte Digital", "Casos de Uso"],
    content: "Descubre las diversas aplicaciones de los tokens no fungibles, desde coleccionables hasta identidad digital."
  },
  {
    id: "4",
    title: "El impacto de la regulación en el ecosistema Crypto",
    author: "Ricardo Castro",
    date: "2024-06-28",
    tags: ["Regulación", "Criptomonedas", "Leyes"],
    content: "Un vistazo a las leyes que están moldeando el futuro de las criptomonedas en México y el mundo."
  },
  {
    id: "5",
    title: "Staking: Genera ingresos pasivos con tus criptos",
    author: "Valeria Gómez",
    date: "2024-06-20",
    tags: ["Staking", "Ingresos Pasivos", "DeFi"],
    content: "Aprende cómo puedes obtener recompensas al participar en la validación de redes blockchain."
  }
];

export const mockEvents = [
  {
    id: "1",
    title: "DeFi Summit CDMX",
    date: "2024-08-05",
    location: "Ciudad de México",
    description: "El evento más importante de finanzas descentralizadas en México.",
    isUpcoming: true
  },
  {
    id: "2",
    title: "Blockchain Day Monterrey",
    date: "2024-09-12",
    location: "Monterrey, Nuevo León",
    description: "Un día completo de conferencias y talleres sobre tecnología blockchain.",
    isUpcoming: true
  },
  {
    id: "3",
    title: "Web3 Nights Guadalajara",
    date: "2024-10-20",
    location: "Guadalajara, Jalisco",
    description: "Networking y charlas sobre el futuro de la web descentralizada.",
    isUpcoming: false
  },
  {
    id: "4",
    title: "DeFi Workshop Online",
    date: "2024-11-10",
    location: "Online",
    description: "Aprende los fundamentos de las finanzas descentralizadas desde casa.",
    isUpcoming: false
  },
  {
    id: "5",
    title: "Crypto Meetup Tijuana",
    date: "2024-12-03",
    location: "Tijuana, Baja California",
    description: "Un encuentro para entusiastas de las criptomonedas en la frontera.",
    isUpcoming: false
  }
];

export const mockStats = [
  { label: "Startups", value: 120 },
  { label: "Blog Posts", value: 45 },
  { label: "Active Events", value: 15 },
  { label: "Monthly Visitors", value: 24500 }
];
