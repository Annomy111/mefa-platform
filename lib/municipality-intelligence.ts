/**
 * 🌍 ULTRATHINK: Municipality Intelligence Database
 * Comprehensive intelligence profiles for Western Balkan municipalities
 * Enables hyper-personalized AI recommendations based on local context
 */

export interface MunicipalityProfile {
  id: string;
  name: string;
  country: string;
  region: string;
  population: number;
  area: number; // km²
  economicProfile: {
    gdpPerCapita: number; // EUR
    unemploymentRate: number; // %
    mainEconomicSectors: string[];
    businessCount: number;
    averageIncome: number; // EUR/month
  };
  demographics: {
    ageGroups: {
      youth: number; // % under 30
      workingAge: number; // % 30-64
      elderly: number; // % 65+
    };
    education: {
      highEducation: number; // % with university degree
      digitalLiteracy: number; // % digitally literate
    };
    ethnicComposition: string[];
  };
  infrastructure: {
    internetCoverage: number; // % fiber/broadband
    roadQuality: number; // 1-10 scale
    publicTransport: number; // 1-10 scale
    wasteManagement: number; // 1-10 scale
    waterSupply: number; // % coverage
    energyEfficiency: number; // 1-10 scale
  };
  governance: {
    transparencyScore: number; // 1-10 scale
    digitalServices: number; // % services online
    citizenEngagement: number; // 1-10 scale
    euComplianceLevel: number; // 1-10 scale
  };
  challenges: string[];
  opportunities: string[];
  successfulProjects: string[];
  preferredPartners: string[];
  strategicPriorities: string[];
}

// 🚀 COMPREHENSIVE WESTERN BALKAN MUNICIPALITY DATABASE
export const municipalityDatabase: Record<string, MunicipalityProfile> = {
  // 🇦🇱 ALBANIA
  tirana: {
    id: 'tirana',
    name: 'Tirana',
    country: 'Albania',
    region: 'Central Albania',
    population: 557422,
    area: 41.8,
    economicProfile: {
      gdpPerCapita: 7800,
      unemploymentRate: 12.8,
      mainEconomicSectors: ['Services', 'Construction', 'Manufacturing', 'Tourism'],
      businessCount: 45000,
      averageIncome: 650
    },
    demographics: {
      ageGroups: { youth: 35, workingAge: 58, elderly: 7 },
      education: { highEducation: 28, digitalLiteracy: 72 },
      ethnicComposition: ['Albanian 95%', 'Greek 2%', 'Other 3%']
    },
    infrastructure: {
      internetCoverage: 85,
      roadQuality: 6,
      publicTransport: 7,
      wasteManagement: 6,
      waterSupply: 92,
      energyEfficiency: 5
    },
    governance: {
      transparencyScore: 6,
      digitalServices: 45,
      citizenEngagement: 7,
      euComplianceLevel: 6
    },
    challenges: ['Air pollution', 'Urban sprawl', 'Traffic congestion', 'Informal construction'],
    opportunities: ['Smart city development', 'Green transportation', 'Digital government', 'Cultural tourism'],
    successfulProjects: ['Tirana River revitalization', 'Pedestrian zones', 'Public bike system'],
    preferredPartners: ['Italian municipalities', 'EU cities network', 'World Bank', 'Regional development agencies'],
    strategicPriorities: ['Digital transformation', 'Green mobility', 'Urban regeneration', 'Citizen services']
  },

  durres: {
    id: 'durres',
    name: 'Durrës',
    country: 'Albania',
    region: 'Western Albania',
    population: 175110,
    area: 338.3,
    economicProfile: {
      gdpPerCapita: 6200,
      unemploymentRate: 15.2,
      mainEconomicSectors: ['Port operations', 'Tourism', 'Agriculture', 'Manufacturing'],
      businessCount: 8500,
      averageIncome: 520
    },
    demographics: {
      ageGroups: { youth: 32, workingAge: 60, elderly: 8 },
      education: { highEducation: 22, digitalLiteracy: 68 },
      ethnicComposition: ['Albanian 96%', 'Greek 2%', 'Other 2%']
    },
    infrastructure: {
      internetCoverage: 78,
      roadQuality: 7,
      publicTransport: 5,
      wasteManagement: 5,
      waterSupply: 88,
      energyEfficiency: 4
    },
    governance: {
      transparencyScore: 5,
      digitalServices: 35,
      citizenEngagement: 6,
      euComplianceLevel: 5
    },
    challenges: ['Coastal erosion', 'Seasonal unemployment', 'Water quality', 'Infrastructure aging'],
    opportunities: ['Port modernization', 'Beach tourism', 'Logistics hub', 'Renewable energy'],
    successfulProjects: ['Port expansion', 'Tourism infrastructure', 'Coastal protection'],
    preferredPartners: ['Italian port cities', 'Adriatic-Ionian Initiative', 'EU tourism programs'],
    strategicPriorities: ['Port competitiveness', 'Sustainable tourism', 'Coastal management', 'Youth employment']
  },

  // 🇧🇦 BOSNIA AND HERZEGOVINA
  sarajevo: {
    id: 'sarajevo',
    name: 'Sarajevo',
    country: 'Bosnia and Herzegovina',
    region: 'Central Bosnia',
    population: 413593,
    area: 141.5,
    economicProfile: {
      gdpPerCapita: 6800,
      unemploymentRate: 18.4,
      mainEconomicSectors: ['Public administration', 'Manufacturing', 'Tourism', 'Services'],
      businessCount: 12000,
      averageIncome: 580
    },
    demographics: {
      ageGroups: { youth: 30, workingAge: 62, elderly: 8 },
      education: { highEducation: 32, digitalLiteracy: 75 },
      ethnicComposition: ['Bosniak 78%', 'Serb 12%', 'Croat 8%', 'Other 2%']
    },
    infrastructure: {
      internetCoverage: 82,
      roadQuality: 5,
      publicTransport: 6,
      wasteManagement: 6,
      waterSupply: 95,
      energyEfficiency: 4
    },
    governance: {
      transparencyScore: 5,
      digitalServices: 40,
      citizenEngagement: 6,
      euComplianceLevel: 5
    },
    challenges: ['Air pollution', 'Youth emigration', 'Administrative complexity', 'Infrastructure needs'],
    opportunities: ['Cultural tourism', 'Winter Olympics legacy', 'Tech sector growth', 'EU integration'],
    successfulProjects: ['Tram network modernization', 'Historic center restoration', 'IT cluster development'],
    preferredPartners: ['EU municipalities', 'Olympic cities network', 'Cultural heritage organizations'],
    strategicPriorities: ['Air quality improvement', 'Digital economy', 'Tourism development', 'Youth retention']
  },

  // 🇲🇪 MONTENEGRO
  podgorica: {
    id: 'podgorica',
    name: 'Podgorica',
    country: 'Montenegro',
    region: 'Central Montenegro',
    population: 185937,
    area: 1441,
    economicProfile: {
      gdpPerCapita: 8900,
      unemploymentRate: 16.1,
      mainEconomicSectors: ['Public administration', 'Services', 'Manufacturing', 'Agriculture'],
      businessCount: 5200,
      averageIncome: 720
    },
    demographics: {
      ageGroups: { youth: 28, workingAge: 64, elderly: 8 },
      education: { highEducation: 35, digitalLiteracy: 78 },
      ethnicComposition: ['Montenegrin 47%', 'Serb 32%', 'Bosniak 12%', 'Other 9%']
    },
    infrastructure: {
      internetCoverage: 88,
      roadQuality: 7,
      publicTransport: 5,
      wasteManagement: 4,
      waterSupply: 90,
      energyEfficiency: 5
    },
    governance: {
      transparencyScore: 6,
      digitalServices: 50,
      citizenEngagement: 6,
      euComplianceLevel: 7
    },
    challenges: ['Waste management', 'Air quality', 'Urban planning', 'Public transport efficiency'],
    opportunities: ['Smart city initiatives', 'Green technology', 'Regional hub development', 'EU integration'],
    successfulProjects: ['City center revitalization', 'Digital services platform', 'Environmental monitoring'],
    preferredPartners: ['EU capital cities', 'Smart city networks', 'Environmental agencies'],
    strategicPriorities: ['Waste management reform', 'Smart city development', 'Air quality', 'Digital services']
  },

  // 🇷🇸 SERBIA
  belgrade: {
    id: 'belgrade',
    name: 'Belgrade',
    country: 'Serbia',
    region: 'Central Serbia',
    population: 1344844,
    area: 3222,
    economicProfile: {
      gdpPerCapita: 9200,
      unemploymentRate: 14.7,
      mainEconomicSectors: ['Services', 'Manufacturing', 'IT', 'Tourism'],
      businessCount: 85000,
      averageIncome: 780
    },
    demographics: {
      ageGroups: { youth: 26, workingAge: 66, elderly: 8 },
      education: { highEducation: 38, digitalLiteracy: 82 },
      ethnicComposition: ['Serb 88%', 'Yugoslav 3%', 'Other 9%']
    },
    infrastructure: {
      internetCoverage: 92,
      roadQuality: 6,
      publicTransport: 7,
      wasteManagement: 6,
      waterSupply: 96,
      energyEfficiency: 5
    },
    governance: {
      transparencyScore: 5,
      digitalServices: 55,
      citizenEngagement: 6,
      euComplianceLevel: 6
    },
    challenges: ['Air pollution', 'Traffic congestion', 'River pollution', 'Administrative efficiency'],
    opportunities: ['Tech hub expansion', 'Danube corridor development', 'Cultural tourism', 'Smart governance'],
    successfulProjects: ['Belgrade Waterfront', 'IT sector growth', 'Cultural quarter development'],
    preferredPartners: ['EU capitals', 'Danube region cities', 'Tech innovation hubs'],
    strategicPriorities: ['Digital transformation', 'Environmental protection', 'Innovation ecosystem', 'Urban mobility']
  },

  // 🇲🇰 NORTH MACEDONIA
  skopje: {
    id: 'skopje',
    name: 'Skopje',
    country: 'North Macedonia',
    region: 'Central Macedonia',
    population: 526502,
    area: 1854,
    economicProfile: {
      gdpPerCapita: 6400,
      unemploymentRate: 17.3,
      mainEconomicSectors: ['Manufacturing', 'Services', 'Public administration', 'Agriculture'],
      businessCount: 18000,
      averageIncome: 540
    },
    demographics: {
      ageGroups: { youth: 31, workingAge: 61, elderly: 8 },
      education: { highEducation: 29, digitalLiteracy: 71 },
      ethnicComposition: ['Macedonian 64%', 'Albanian 25%', 'Turkish 4%', 'Other 7%']
    },
    infrastructure: {
      internetCoverage: 79,
      roadQuality: 6,
      publicTransport: 5,
      wasteManagement: 5,
      waterSupply: 92,
      energyEfficiency: 4
    },
    governance: {
      transparencyScore: 5,
      digitalServices: 42,
      citizenEngagement: 6,
      euComplianceLevel: 6
    },
    challenges: ['Air pollution', 'Inter-ethnic integration', 'Economic development', 'Infrastructure modernization'],
    opportunities: ['Regional transport hub', 'Manufacturing growth', 'Cultural diversity', 'EU accession momentum'],
    successfulProjects: ['Public transport modernization', 'Industrial zones', 'Cultural sites restoration'],
    preferredPartners: ['EU municipalities', 'Regional cooperation initiatives', 'International development agencies'],
    strategicPriorities: ['Air quality improvement', 'Economic competitiveness', 'Social cohesion', 'EU integration']
  },

  // 🇽🇰 KOSOVO
  pristina: {
    id: 'pristina',
    name: 'Pristina',
    country: 'Kosovo',
    region: 'Central Kosovo',
    population: 198897,
    area: 854,
    economicProfile: {
      gdpPerCapita: 4200,
      unemploymentRate: 25.9,
      mainEconomicSectors: ['Public administration', 'Services', 'Construction', 'Agriculture'],
      businessCount: 7500,
      averageIncome: 360
    },
    demographics: {
      ageGroups: { youth: 45, workingAge: 50, elderly: 5 },
      education: { highEducation: 26, digitalLiteracy: 69 },
      ethnicComposition: ['Albanian 92%', 'Serbian 2%', 'Other 6%']
    },
    infrastructure: {
      internetCoverage: 75,
      roadQuality: 5,
      publicTransport: 4,
      wasteManagement: 4,
      waterSupply: 85,
      energyEfficiency: 3
    },
    governance: {
      transparencyScore: 4,
      digitalServices: 30,
      citizenEngagement: 5,
      euComplianceLevel: 5
    },
    challenges: ['Youth unemployment', 'Energy security', 'Waste management', 'Infrastructure development'],
    opportunities: ['Young population', 'Diaspora connections', 'EU integration path', 'Digital economy potential'],
    successfulProjects: ['University campus expansion', 'IT training programs', 'Urban renewal initiatives'],
    preferredPartners: ['EU development agencies', 'Diaspora organizations', 'International NGOs'],
    strategicPriorities: ['Youth employment', 'Infrastructure development', 'Digital skills', 'European integration']
  }
};

// 🎯 INTELLIGENCE FUNCTIONS

export function getMunicipalityProfile(municipalityName: string): MunicipalityProfile | null {
  const key = municipalityName.toLowerCase().replace(/[^a-z]/g, '');
  return municipalityDatabase[key] || null;
}

export function generateMunicipalityIntelligence(municipalityName: string, projectContext: any): {
  profile: MunicipalityProfile | null;
  relevantChallenges: string[];
  alignedOpportunities: string[];
  recommendedPartners: string[];
  localContext: string;
  budgetGuidance: string;
} {
  const profile = getMunicipalityProfile(municipalityName);

  if (!profile) {
    return {
      profile: null,
      relevantChallenges: [],
      alignedOpportunities: [],
      recommendedPartners: [],
      localContext: 'Municipality profile not available in database',
      budgetGuidance: 'Standard EU funding guidelines apply'
    };
  }

  // Analyze project context against municipality profile
  const projectKeywords = `${projectContext.title} ${projectContext.description} ${projectContext.objectives}`.toLowerCase();

  // Match challenges with project focus
  const relevantChallenges = profile.challenges.filter(challenge =>
    projectKeywords.includes(challenge.toLowerCase().split(' ')[0])
  );

  // Match opportunities with project potential
  const alignedOpportunities = profile.opportunities.filter(opportunity =>
    projectKeywords.includes(opportunity.toLowerCase().split(' ')[0])
  );

  // Generate local context summary
  const localContext = `
${profile.name} (${profile.country}) - Population: ${profile.population.toLocaleString()}, GDP per capita: €${profile.economicProfile.gdpPerCapita}
Key Economic Sectors: ${profile.economicProfile.mainEconomicSectors.join(', ')}
Major Challenges: ${relevantChallenges.length > 0 ? relevantChallenges.join(', ') : profile.challenges.slice(0, 2).join(', ')}
Strategic Opportunities: ${alignedOpportunities.length > 0 ? alignedOpportunities.join(', ') : profile.opportunities.slice(0, 2).join(', ')}
Infrastructure Level: Internet ${profile.infrastructure.internetCoverage}%, Governance Score: ${profile.governance.transparencyScore}/10
`.trim();

  // Generate budget guidance based on municipality size and economic profile
  const populationCategory = profile.population > 500000 ? 'large' : profile.population > 100000 ? 'medium' : 'small';
  const economicLevel = profile.economicProfile.gdpPerCapita > 8000 ? 'high' : profile.economicProfile.gdpPerCapita > 6000 ? 'medium' : 'developing';

  const budgetGuidance = `
Municipality Category: ${populationCategory} city, ${economicLevel} income level
Recommended EU co-financing: ${economicLevel === 'developing' ? '85%' : economicLevel === 'medium' ? '75%' : '65%'}
Typical project range: €${populationCategory === 'large' ? '2-10M' : populationCategory === 'medium' ? '0.5-5M' : '0.2-2M'}
Local co-financing capacity: ${profile.governance.euComplianceLevel >= 6 ? 'Strong' : profile.governance.euComplianceLevel >= 4 ? 'Moderate' : 'Limited'}
`.trim();

  return {
    profile,
    relevantChallenges,
    alignedOpportunities,
    recommendedPartners: profile.preferredPartners,
    localContext,
    budgetGuidance
  };
}

// 🚀 MUNICIPALITY-SPECIFIC PROMPT ENHANCEMENT
export function enhancePromptWithMunicipalityIntelligence(
  basePrompt: string,
  municipalityName: string,
  projectContext: any
): string {
  const intelligence = generateMunicipalityIntelligence(municipalityName, projectContext);

  if (!intelligence.profile) {
    return basePrompt + '\n\nNote: Municipality-specific intelligence not available. Use general Western Balkan context.';
  }

  const enhancedPrompt = basePrompt + `

🌍 MUNICIPALITY-SPECIFIC INTELLIGENCE ACTIVATED
${intelligence.localContext}

💼 BUDGET & FINANCING INTELLIGENCE:
${intelligence.budgetGuidance}

🎯 LOCAL OPTIMIZATION REQUIREMENTS:
• Address specific local challenges: ${intelligence.relevantChallenges.join(', ') || 'General municipal development needs'}
• Leverage local opportunities: ${intelligence.alignedOpportunities.join(', ') || 'Standard development potential'}
• Consider demographic profile: ${intelligence.profile.demographics.ageGroups.youth}% youth, ${intelligence.profile.demographics.education.highEducation}% higher education
• Infrastructure context: ${intelligence.profile.infrastructure.internetCoverage}% internet coverage, ${intelligence.profile.infrastructure.energyEfficiency}/10 energy efficiency
• Governance level: ${intelligence.profile.governance.transparencyScore}/10 transparency, ${intelligence.profile.governance.digitalServices}% services digitalized

🤝 RECOMMENDED PARTNERSHIPS:
${intelligence.recommendedPartners.slice(0, 3).join(', ')}

🚀 MUNICIPALITY EXCELLENCE MANDATE:
Your response must be specifically tailored to ${intelligence.profile.name}'s unique context, challenges, and opportunities. Reference local conditions, demographics, and strategic priorities. Ensure all recommendations are realistic given the municipality's capacity and resources.
`;

  return enhancedPrompt;
}