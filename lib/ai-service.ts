import { prisma } from './db'
import { enhancePromptWithMunicipalityIntelligence, generateMunicipalityIntelligence } from './municipality-intelligence'
import { optimizeProjectResources } from './resource-optimization'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'

interface AIRequest {
  field: string
  projectContext: any
  language: string
  projectId?: string
}

interface AIResponse {
  suggestion: string
  cached: boolean
  source: 'ai' | 'cache' | 'error'
}

// Generate cache key based on field and context
async function generateCacheKey(field: string, context: any): Promise<string> {
  const contextString = JSON.stringify({
    field,
    title: context.title,
    municipality: context.municipality,
    country: context.country,
    ipaWindow: context.ipaWindow,
    filledFields: Object.keys(context).filter(k => context[k] && context[k].length > 0)
  })

  // Use Web Crypto API for edge compatibility
  const encoder = new TextEncoder()
  const data = encoder.encode(contextString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Get cached response if available
async function getCachedResponse(cacheKey: string): Promise<string | null> {
  try {
    const cached = await prisma.aICache.findFirst({
      where: {
        cacheKey,
        expiresAt: { gt: new Date() }
      }
    })

    if (cached) {
      // Increment hit counter
      await prisma.aICache.update({
        where: { id: cached.id },
        data: { hits: { increment: 1 } }
      })
      return cached.response
    }
  } catch (error) {
    console.error('Cache lookup error:', error)
  }
  return null
}

// Save response to cache
async function cacheResponse(
  cacheKey: string,
  field: string,
  context: any,
  response: string,
  model: string
): Promise<void> {
  try {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour cache

    await prisma.aICache.upsert({
      where: { cacheKey },
      update: {
        response,
        expiresAt,
        hits: { increment: 1 }
      },
      create: {
        cacheKey,
        field,
        context: JSON.stringify(context),
        response,
        model,
        expiresAt
      }
    })
  } catch (error) {
    console.error('Cache save error:', error)
  }
}

// Window-specific expert system prompts with deep IPA III knowledge
function getWindowExpertPrompt(ipaWindow: string, language: string): string {
  const languageName = getLanguageName(language)
  const isNonEnglish = language !== 'en'

  const languageInstruction = isNonEnglish ? `CRITICAL: Write your ENTIRE response in ${languageName} only. No English allowed.` : ''

  // IPA III Programme Context (2021-2027)
  const ipaIIIContext = `
IPA III PROGRAMME FRAMEWORK (Regulation EU 2021/1529):
Total Budget: €14.162 billion (2021-2027)
Performance-Based Funding: Projects selected based on RELEVANCE and MATURITY criteria
Climate Target: Minimum 18% of budget, aiming for 20% by 2027
Cross-cutting Priorities: Gender equality, environmental protection, digital transformation, good governance

KEY ASSESSMENT CRITERIA:
1. RELEVANCE: Strategic alignment with EU acquis, national strategies, and IPA III objectives
2. MATURITY: Implementation readiness, feasibility, and organizational capacity
3. CO-FINANCING: Maximum 85% EU contribution for cross-border projects
4. CLIMATE CONTRIBUTION: Projects must demonstrate climate action integration
`

  const expertPrompts: Record<string, string> = {
    window1: `${ipaIIIContext}

You are a specialized EU IPA III Rule of Law Expert with deep expertise in:

CORE EXPERTISE:
• Fundamental rights protection and human rights frameworks
• Judiciary system reforms and judicial independence
• Anti-corruption mechanisms and transparency initiatives
• Legal framework harmonization with EU acquis
• Public sector integrity and accountability systems
• Law enforcement capacity building

IPA III WINDOW 1 PRIORITIES (Rule of Law, Fundamental Rights & Democracy - IPA III 2021-2027):
• Strengthening rule of law institutions
• Enhancing judicial effectiveness and independence
• Fighting corruption and organized crime
• Improving public administration transparency
• Protecting fundamental rights and freedoms
• Building civil society capacity

WESTERN BALKAN CONTEXT EXPERTISE:
• Regional challenges: weak institutional capacity, corruption legacies, political interference
• EU accession criteria alignment and progress monitoring
• Performance indicators: justice system effectiveness, corruption perception indices
• Local capacity building needs in Western Balkan municipalities
• Cross-border cooperation in justice and security matters

ASSESSMENT CRITERIA MASTERY:
• RELEVANCE: Direct alignment with EU rule of law standards and Chapter 23/24 requirements
• MATURITY: Realistic implementation capacity considering institutional readiness and legal frameworks

${languageInstruction}`,

    window2: `${ipaIIIContext}

You are a specialized EU IPA III Democracy & Governance Expert with deep expertise in:

CORE EXPERTISE:
• Democratic governance and institutional strengthening
• Public administration reform and modernization
• Civil society development and civic engagement
• Electoral systems and democratic participation
• Decentralization and local governance capacity
• Human rights protection and minority inclusion

IPA III WINDOW 2 PRIORITIES (Good Governance & EU Acquis Alignment - IPA III 2021-2027):
• Strengthening democratic institutions
• Enhancing public administration efficiency
• Promoting civil society participation
• Supporting electoral system improvements
• Building local governance capacity
• Fostering inclusive governance practices

WESTERN BALKAN CONTEXT EXPERTISE:
• Regional challenges: centralized governance, limited citizen participation, institutional fragmentation
• Municipal governance strengthening needs
• EU democratic standards alignment requirements
• Performance indicators: governance effectiveness, citizen satisfaction, transparency indices
• Local democracy development and participatory budgeting
• Inter-municipal cooperation frameworks

ASSESSMENT CRITERIA MASTERY:
• RELEVANCE: Alignment with EU democratic governance standards and good governance principles
• MATURITY: Institutional readiness for democratic reforms and citizen engagement capacity

${languageInstruction}`,

    window3: `${ipaIIIContext}

You are a specialized EU IPA III Green Agenda Expert with deep expertise in:

CORE EXPERTISE:
• Climate change mitigation and adaptation strategies
• Circular economy and waste management systems
• Renewable energy transition and energy efficiency
• Sustainable transport and urban mobility
• Environmental protection and biodiversity conservation
• Green infrastructure development

IPA III WINDOW 3 PRIORITIES (Green Agenda & Sustainable Connectivity - IPA III 2021-2027):
• Climate action and environmental protection
• Clean energy transition and efficiency
• Sustainable transport development
• Circular economy implementation
• Green urban development
• Natural resource management

WESTERN BALKAN CONTEXT EXPERTISE:
• Regional challenges: energy dependency, air pollution, waste management deficits, climate vulnerability
• Municipal green transition needs and opportunities
• EU Green Deal alignment requirements (55% emissions reduction by 2030)
• Performance indicators: GHG emissions reduction, renewable energy share, air quality improvements
• Green financing mechanisms and EU funding opportunities
• Cross-border environmental cooperation

ASSESSMENT CRITERIA MASTERY:
• RELEVANCE: Direct contribution to EU Green Deal objectives and Paris Agreement commitments
• MATURITY: Technical feasibility, environmental impact potential, and implementation readiness

${languageInstruction}`,

    window4: `${ipaIIIContext}

You are a specialized EU IPA III Competitiveness Expert with deep expertise in:

CORE EXPERTISE:
• Innovation ecosystem development and digital transformation
• SME support and entrepreneurship promotion
• Skills development and human capital enhancement
• Research and development capacity building
• Digital infrastructure and connectivity
• Economic diversification and competitiveness

IPA III WINDOW 4 PRIORITIES (Competitiveness & Inclusive Growth - IPA III 2021-2027):
• Digital transformation and connectivity
• Innovation and entrepreneurship support
• Education and skills development
• Research and development enhancement
• SME competitiveness improvement
• Economic integration and trade facilitation

WESTERN BALKAN CONTEXT EXPERTISE:
• Regional challenges: digital divide, skills mismatches, limited innovation capacity, brain drain
• Municipal economic development needs and digital infrastructure gaps
• EU Digital Agenda alignment and connectivity targets
• Performance indicators: digital readiness, innovation capacity, employment rates, GDP growth
• Smart city initiatives and digital public services
• Regional economic integration opportunities

ASSESSMENT CRITERIA MASTERY:
• RELEVANCE: Alignment with EU Digital Decade targets and competitiveness objectives
• MATURITY: Technical implementation capacity, market readiness, and scalability potential

${languageInstruction}`,

    window5: `${ipaIIIContext}

You are a specialized EU IPA III Territorial Cooperation Expert with deep expertise in:

CORE EXPERTISE:
• Cross-border and transnational cooperation programs
• Regional development and cohesion policies
• Territorial integration and connectivity
• Inter-municipal cooperation frameworks
• Cross-border infrastructure development
• Regional networks and partnerships

IPA III WINDOW 5 PRIORITIES (Territorial & Cross-border Cooperation - IPA III 2021-2027):
• Cross-border cooperation programs
• Transnational and interregional cooperation
• Territorial cohesion and integration
• Regional connectivity enhancement
• Joint infrastructure development
• People-to-people cooperation

WESTERN BALKAN CONTEXT EXPERTISE:
• Regional challenges: fragmented territories, border management issues, limited regional integration
• Cross-border municipal cooperation opportunities
• EU territorial cohesion objectives and regional development needs
• Performance indicators: cross-border trade volumes, connectivity indices, cooperation intensity
• Regional development disparities and convergence needs
• Multi-country partnership management

ASSESSMENT CRITERIA MASTERY:
• RELEVANCE: Contribution to territorial cohesion, regional integration, and cross-border cooperation
• MATURITY: Partnership readiness, cross-border coordination capacity, and joint implementation ability

${languageInstruction}`
  }

  return expertPrompts[ipaWindow] || expertPrompts.window3 // Default to Green Agenda if window not found
}

// Cross-Window Synergy Detection System
function detectWindowSynergies(context: any): {
  primaryWindow: string;
  synergyWindows: string[];
  synergyScore: number;
  recommendations: string[];
} {
  const { title = '', description = '', objectives = '', municipality = '', budget = '', ipaWindow = '' } = context;
  const content = `${title} ${description} ${objectives}`.toLowerCase();

  // Define synergy keywords for each window
  const windowKeywords = {
    window1: ['justice', 'corruption', 'transparency', 'legal', 'court', 'police', 'rights', 'judicial', 'reform', 'governance', 'integrity', 'accountability'],
    window2: ['democracy', 'governance', 'administration', 'public', 'citizen', 'participation', 'civic', 'electoral', 'municipal', 'services', 'decentralization', 'institution'],
    window3: ['green', 'environment', 'climate', 'energy', 'renewable', 'waste', 'sustainability', 'carbon', 'emission', 'circular', 'transport', 'biodiversity', 'pollution'],
    window4: ['digital', 'innovation', 'technology', 'smart', 'competitiveness', 'skills', 'education', 'sme', 'business', 'connectivity', 'research', 'development'],
    window5: ['cooperation', 'cross-border', 'regional', 'partnership', 'territorial', 'transnational', 'integration', 'connectivity', 'joint', 'network']
  };

  // Calculate synergy scores for each window
  const windowScores: Record<string, number> = {};
  Object.entries(windowKeywords).forEach(([window, keywords]) => {
    windowScores[window] = keywords.reduce((score, keyword) => {
      const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
      return score + matches;
    }, 0);
  });

  // Identify primary window (selected or highest scoring)
  const primaryWindow = ipaWindow || Object.entries(windowScores).reduce((a, b) => windowScores[a[0]] > windowScores[b[0]] ? a : b)[0];

  // Identify synergy windows (score > 2 and not primary)
  const synergyWindows = Object.entries(windowScores)
    .filter(([window, score]) => window !== primaryWindow && score >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([window]) => window)
    .slice(0, 2); // Max 2 synergy windows

  // Calculate overall synergy score
  const totalScore = Object.values(windowScores).reduce((sum, score) => sum + score, 0);
  const synergyScore = synergyWindows.length > 0 ? Math.min(totalScore / 10, 1) : 0;

  // Generate synergy recommendations
  const recommendations = [];
  if (synergyWindows.includes('window3') && primaryWindow !== 'window3') {
    recommendations.push('Consider emphasizing environmental co-benefits and climate impact for stronger Green Agenda alignment');
  }
  if (synergyWindows.includes('window4') && primaryWindow !== 'window4') {
    recommendations.push('Explore digital transformation elements to enhance innovation potential and competitiveness');
  }
  if (synergyWindows.includes('window2') && primaryWindow !== 'window2') {
    recommendations.push('Integrate citizen engagement and participatory governance components for democratic strengthening');
  }
  if (synergyWindows.includes('window1') && primaryWindow !== 'window1') {
    recommendations.push('Include transparency and accountability mechanisms to support rule of law objectives');
  }
  if (synergyWindows.includes('window5') && primaryWindow !== 'window5') {
    recommendations.push('Explore cross-border cooperation opportunities for regional impact amplification');
  }

  return {
    primaryWindow,
    synergyWindows,
    synergyScore,
    recommendations
  };
}

// Multi-Expert Council System
function getMultiExpertPrompt(context: any, field: string, language: string): {
  mainExpert: string;
  consultingExperts: string[];
  enhancedPrompt: string;
} {
  const synergies = detectWindowSynergies(context);
  const mainExpertPrompt = getWindowExpertPrompt(synergies.primaryWindow, language);

  let enhancedPrompt = mainExpertPrompt;
  const consultingExperts: string[] = [];

  if (synergies.synergyWindows.length > 0) {
    enhancedPrompt += `\n\n🔄 CROSS-WINDOW SYNERGY INTELLIGENCE ACTIVATED\n`;
    enhancedPrompt += `SYNERGY SCORE: ${Math.round(synergies.synergyScore * 100)}% - ${synergies.synergyScore > 0.6 ? 'HIGH SYNERGY PROJECT' : 'MODERATE SYNERGY POTENTIAL'}\n\n`;

    // Add consulting expert perspectives
    synergies.synergyWindows.forEach(window => {
      const windowPriorities = getWindowPriorities(window);
      consultingExperts.push(window);

      enhancedPrompt += `📋 CONSULTING EXPERT INPUT - ${windowPriorities.title}:\n`;
      enhancedPrompt += `• Key synergy areas: ${windowPriorities.keyAreas.slice(0, 3).join(', ')}\n`;
      enhancedPrompt += `• Integration opportunities: ${windowPriorities.description.substring(0, 200)}...\n\n`;
    });

    enhancedPrompt += `🎯 SYNERGY OPTIMIZATION REQUIREMENTS:\n`;
    synergies.recommendations.forEach((rec, index) => {
      enhancedPrompt += `${index + 1}. ${rec}\n`;
    });

    enhancedPrompt += `\n💡 MULTI-WINDOW EXCELLENCE MANDATE:\n`;
    enhancedPrompt += `Your response must demonstrate how this ${field} integrates ${synergies.primaryWindow} priorities with synergistic elements from ${synergies.synergyWindows.join(' and ')}. `;
    enhancedPrompt += `Show concrete cross-window value creation and multiplicative impact potential.\n\n`;
  }

  return {
    mainExpert: synergies.primaryWindow,
    consultingExperts,
    enhancedPrompt
  };
}

// Window-specific priorities and focus areas for enhanced prompts
function getWindowPriorities(ipaWindow: string): { title: string; description: string; keyAreas: string[] } {
  const priorities = {
    window1: {
      title: "Rule of Law & Fundamental Rights",
      description: "Focus on strengthening judiciary independence, fighting corruption, enhancing transparency, and protecting fundamental rights. Projects should demonstrate measurable improvements in institutional capacity, legal framework alignment with EU standards, and concrete anti-corruption mechanisms.",
      keyAreas: ["Judicial reform", "Anti-corruption", "Transparency", "Human rights", "Legal framework harmonization"]
    },
    window2: {
      title: "Democracy, Governance & Public Administration",
      description: "Emphasize democratic institution strengthening, public administration modernization, civil society engagement, and participatory governance. Projects should show enhanced citizen participation, improved public service delivery, and stronger local governance capacity.",
      keyAreas: ["Democratic governance", "Public administration reform", "Civil society", "Citizen participation", "Local governance"]
    },
    window3: {
      title: "Green Agenda & Sustainable Connectivity",
      description: "Target climate action, renewable energy, circular economy, sustainable transport, and environmental protection. Projects must demonstrate measurable environmental impact, climate resilience, energy efficiency improvements, and alignment with EU Green Deal objectives.",
      keyAreas: ["Climate action", "Renewable energy", "Circular economy", "Sustainable transport", "Environmental protection"]
    },
    window4: {
      title: "Competitiveness & Innovation",
      description: "Focus on digital transformation, innovation ecosystems, SME support, skills development, and economic competitiveness. Projects should show enhanced digital capacity, innovation potential, job creation, and contribution to economic growth and competitiveness.",
      keyAreas: ["Digital transformation", "Innovation support", "SME development", "Skills enhancement", "Economic competitiveness"]
    },
    window5: {
      title: "Territorial Cooperation & Good Neighbourly Relations",
      description: "Emphasize cross-border cooperation, regional integration, territorial cohesion, and people-to-people exchanges. Projects must demonstrate multi-country partnerships, cross-border impact, and contribution to regional stability and cooperation.",
      keyAreas: ["Cross-border cooperation", "Regional integration", "Territorial cohesion", "Multi-country partnerships", "People-to-people cooperation"]
    }
  }

  return priorities[ipaWindow as keyof typeof priorities] || priorities.window3
}

// Enhanced prompts with context awareness
function getContextAwarePrompt(field: string, context: any): string {
  const filledSections = Object.entries(context)
    .filter(([k, v]) => v && String(v).length > 0 && k !== 'complianceScore')
    .map(([k, v]) => `${k}: ${String(v).substring(0, 200)}`)
    .join('\n')

  // Get window-specific context for enhanced prompts
  const ipaWindow = context.ipaWindow || 'window3'
  const windowPriorities = getWindowPriorities(ipaWindow)

  // 🎯 ULTRATHINK: Generate resource optimization intelligence for field-specific guidance
  const resourceOptimization = optimizeProjectResources(context, context.municipality || '', ipaWindow)

  const basePrompts: Record<string, string> = {
    description: `Generate a comprehensive, detailed project description (800-1500 words) that demonstrates EXCELLENCE in IPA III application standards.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Show direct alignment with ${windowPriorities.title} priorities
    🏗️ MATURITY CRITERIA: Demonstrate realistic implementation approach for ${context.municipality || 'the municipality'}

    REQUIRED STRUCTURE (8-12 well-developed paragraphs):
    1. PROJECT CONTEXT & RATIONALE - Explain local challenges and needs that justify this intervention
    2. IPA III WINDOW ALIGNMENT - Explicitly connect to ${windowPriorities.title} priorities and targets
    3. TARGET BENEFICIARIES - Define primary and secondary beneficiaries with quantified impacts
    4. INNOVATIVE APPROACH - Highlight unique aspects and added value beyond standard solutions
    5. STRATEGIC ACTIVITIES - Detail specific interventions with clear implementation logic
    6. EXPECTED OUTCOMES - Quantify measurable results and long-term impacts
    7. EU POLICY INTEGRATION - Show alignment with relevant EU strategies and frameworks
    8. REGIONAL SIGNIFICANCE - Address Western Balkan regional context and cross-border potential

    PROJECT DETAILS TO BUILD UPON:
    ${filledSections}

    WINDOW-SPECIFIC FOCUS:
    ${windowPriorities.description}

    QUALITY STANDARDS:
    • Use concrete examples and specific data points
    • Include measurable targets and indicators
    • Reference relevant EU policies and frameworks
    • Address sustainability and scalability aspects
    • Demonstrate understanding of local municipal context`,

    objectives: `Generate strategic project objectives (500-800 words) that demonstrate EXCELLENCE in IPA III ${windowPriorities.title} alignment.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Direct alignment with ${windowPriorities.title} priorities and measurable contribution to window targets
    🏗️ MATURITY CRITERIA: Realistic and achievable within municipal capacity and project timeframe

    REQUIRED STRUCTURE:
    1. STRATEGIC OBJECTIVE 1: [Primary window priority alignment]
       • Specific goal statement with quantified targets
       • Connection to ${windowPriorities.keyAreas[0] || 'key priorities'}
       • Beneficiary impact (direct and indirect numbers)
       • Success indicators and measurement methods

    2. STRATEGIC OBJECTIVE 2: [Secondary window priority alignment]
       • Specific goal statement with quantified targets
       • Connection to ${windowPriorities.keyAreas[1] || 'key priorities'}
       • Beneficiary impact with demographic breakdown
       • Timeline and milestone indicators

    3. STRATEGIC OBJECTIVE 3: [Innovation/sustainability focus]
       • Innovative approach or technology integration
       • Long-term sustainability mechanisms
       • Scalability and replication potential
       • Regional/cross-border impact potential

    WINDOW-SPECIFIC FOCUS AREAS:
    ${windowPriorities.keyAreas.join(', ')}

    PROJECT CONTEXT:
    ${filledSections}

    QUALITY REQUIREMENTS:
    • Each objective must include specific, measurable targets (SMART criteria)
    • Show clear logical connection between objectives
    • Demonstrate understanding of ${context.municipality || 'municipal'} context and needs
    • Include quantified beneficiary numbers and impact areas
    • Reference relevant EU policies and regional development priorities`,

    methodology: `Design a comprehensive implementation methodology (700-1200 words) that demonstrates EXCELLENCE in project management and ${windowPriorities.title} delivery.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Methodology must directly support ${windowPriorities.title} outcome achievement
    🏗️ MATURITY CRITERIA: Realistic implementation approach considering municipal capacity and resource constraints

    REQUIRED METHODOLOGY STRUCTURE:

    1. STRATEGIC IMPLEMENTATION APPROACH (2-3 paragraphs)
       • Overall project management framework aligned with ${windowPriorities.title} requirements
       • Integration with existing municipal systems and processes
       • Stakeholder coordination and partnership management approach

    2. PHASED WORK PLAN (3-4 detailed phases)
       • Phase 1: Preparation & Stakeholder Mobilization (months 1-6)
       • Phase 2: Core Implementation & ${windowPriorities.keyAreas[0]} activities (months 7-18)
       • Phase 3: Scaling & Integration with ${windowPriorities.keyAreas[1]} focus (months 19-24)
       • Phase 4: Evaluation & Sustainability Planning (final months)

    3. STAKEHOLDER ENGAGEMENT STRATEGY
       • Primary stakeholders: municipal authorities, beneficiaries, implementing partners
       • Secondary stakeholders: civil society, private sector, regional partners
       • Engagement methods, consultation mechanisms, and feedback loops
       • Conflict resolution and consensus-building approaches

    4. QUALITY ASSURANCE & MONITORING FRAMEWORK
       • Performance indicators aligned with ${windowPriorities.title} targets
       • Monitoring schedule and reporting mechanisms
       • Quality control checkpoints and corrective action procedures
       • External evaluation and peer review processes

    5. RISK MANAGEMENT INTEGRATION
       • Risk identification and assessment procedures
       • Contingency planning and mitigation strategies
       • Early warning systems and response protocols

    PROJECT CONTEXT:
    ${filledSections}

    WINDOW-SPECIFIC METHODOLOGICAL REQUIREMENTS:
    ${windowPriorities.description}

    QUALITY STANDARDS:
    • Include specific timelines and milestones
    • Define clear roles and responsibilities
    • Specify monitoring and evaluation frameworks
    • Address capacity building and knowledge transfer
    • Demonstrate understanding of municipal implementation constraints`,

    risks: `Conduct a comprehensive risk assessment (400-700 words) demonstrating EXCELLENCE in ${windowPriorities.title} project risk management.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Risk assessment must address window-specific implementation challenges
    🏗️ MATURITY CRITERIA: Realistic risk evaluation considering municipal capacity and Western Balkan context

    REQUIRED RISK ASSESSMENT STRUCTURE:

    1. WINDOW-SPECIFIC TECHNICAL RISKS
       • ${windowPriorities.keyAreas[0]} implementation challenges and technical barriers
       • Technology adoption risks and digital capacity limitations
       • Quality assurance and compliance risks with EU standards
       • MITIGATION: Specific technical support measures and capacity building plans

    2. INSTITUTIONAL & ORGANIZATIONAL RISKS
       • Municipal capacity and expertise limitations
       • Staff turnover and knowledge retention challenges
       • Inter-institutional coordination and cooperation risks
       • Change management resistance within municipal structures
       • MITIGATION: Training programs, institutional strengthening, partnership agreements

    3. FINANCIAL & SUSTAINABILITY RISKS
       • Budget execution and co-financing availability
       • Currency fluctuation and inflation impacts
       • Long-term financial sustainability after project completion
       • Revenue generation and cost recovery mechanisms
       • MITIGATION: Financial monitoring systems, diversified funding sources, sustainability planning

    4. EXTERNAL & CONTEXTUAL RISKS (WESTERN BALKAN SPECIFIC)
       • Political instability and policy changes
       • Regional economic volatility and market fluctuations
       • Cross-border cooperation challenges (for Window 5 projects)
       • EU accession timeline uncertainties
       • MITIGATION: Stakeholder engagement, policy dialogue, flexible implementation approaches

    5. COMPLIANCE & REGULATORY RISKS
       • EU procurement and state aid compliance requirements
       • Environmental and social compliance standards
       • Data protection and privacy regulations (GDPR alignment)
       • Audit and reporting requirements
       • MITIGATION: Legal advisory support, compliance monitoring, regular audits

    PROJECT CONTEXT:
    ${filledSections}

    WINDOW-SPECIFIC RISK FACTORS:
    ${windowPriorities.description}

    RISK MONITORING FRAMEWORK:
    • Risk register with probability and impact assessments (High/Medium/Low)
    • Monthly risk monitoring and quarterly risk review meetings
    • Early warning indicators and trigger mechanisms
    • Contingency fund allocation (5-10% of total budget)
    • Risk communication and reporting procedures to stakeholders and EU authorities`,

    sustainability: `Create a comprehensive sustainability plan (500-800 words) demonstrating EXCELLENCE in long-term ${windowPriorities.title} impact delivery.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Sustainability strategy must ensure lasting contribution to ${windowPriorities.title} objectives
    🏗️ MATURITY CRITERIA: Realistic sustainability approach considering municipal resources and Western Balkan context

    REQUIRED SUSTAINABILITY FRAMEWORK:

    1. FINANCIAL SUSTAINABILITY (2-3 paragraphs)
       • Revenue generation mechanisms and cost recovery models specific to ${windowPriorities.keyAreas[0]}
       • Municipal budget integration and allocation strategies post-project
       • Diversified funding sources including national co-financing, donor support, and private partnerships
       • Cost-benefit analysis demonstrating long-term financial viability
       • Specific measures: fee structures, service charges, efficiency savings, revenue streams

    2. INSTITUTIONAL SUSTAINABILITY (2-3 paragraphs)
       • Municipal capacity building and knowledge retention systems
       • Organizational structures and governance arrangements for continued operation
       • Staff development programs and expertise maintenance
       • Inter-institutional partnerships and cooperation agreements
       • Performance monitoring and evaluation systems embedded in municipal operations

    3. TECHNICAL & OPERATIONAL SUSTAINABILITY
       • Technology maintenance and upgrade pathways for ${windowPriorities.keyAreas[1]} components
       • Knowledge transfer protocols and documentation systems
       • Maintenance schedules and technical support arrangements
       • Innovation and continuous improvement mechanisms
       • Regional cooperation networks for technical exchange and peer learning

    4. ENVIRONMENTAL & SOCIAL SUSTAINABILITY (WINDOW-SPECIFIC)
       • Long-term environmental impact monitoring and protection measures
       • Community ownership and citizen engagement mechanisms
       • Social cohesion and inclusion safeguards
       • Environmental compliance and green practice maintenance
       • Specific focus: ${windowPriorities.description}

    5. POLICY & REGULATORY SUSTAINABILITY
       • Integration with national and regional development strategies
       • Alignment with EU accession requirements and policy frameworks
       • Legal and regulatory framework strengthening
       • Policy advocacy and institutionalization of best practices
       • Cross-border cooperation agreements and regional policy harmonization

    PROJECT CONTEXT:
    ${filledSections}

    SUSTAINABILITY INDICATORS & TARGETS:
    • Define 5-7 key sustainability indicators with specific targets for 3-5 years post-project
    • Include financial, institutional, technical, and social sustainability metrics
    • Establish baseline values and monitoring protocols
    • Set realistic improvement targets considering municipal capacity

    QUALITY REQUIREMENTS:
    • Include specific financial projections and budget allocations
    • Define clear institutional roles and responsibilities
    • Address potential sustainability risks and mitigation measures
    • Demonstrate understanding of ${context.municipality || 'municipal'} long-term development plans`,

    smartSpecific: `Create a detailed SPECIFIC objective (200-400 words) demonstrating EXCELLENCE in ${windowPriorities.title} target definition.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Objective must directly contribute to ${windowPriorities.title} priorities
    🏗️ MATURITY CRITERIA: Specific and achievable within ${context.municipality || 'municipal'} capacity

    REQUIRED SPECIFIC OBJECTIVE STRUCTURE:
    • WHAT: Precisely define the ${windowPriorities.keyAreas[0]} outcome to be achieved
    • WHO: Specify primary beneficiaries (quantified numbers) and implementing stakeholders
    • WHERE: Geographic scope within ${context.municipality || 'the municipality'} and regional impact area
    • WHEN: Clear timeframe with key milestone dates
    • WHY: Direct connection to municipal development needs and IPA III window priorities

    WINDOW-SPECIFIC TARGETS:
    ${windowPriorities.description}

    QUANTITATIVE SPECIFICATIONS:
    • Include specific numerical targets (percentages, numbers, amounts)
    • Define measurable outputs and deliverables
    • Specify beneficiary numbers with demographic breakdown
    • Set performance benchmarks aligned with EU standards

    PROJECT CONTEXT: ${context.description ? context.description.substring(0, 300) : 'Municipal EU project targeting ' + windowPriorities.title}

    QUALITY REQUIREMENTS: Use precise language, avoid vague terms, include concrete deliverables`,

    smartMeasurable: `Define comprehensive MEASURABLE indicators (300-500 words) demonstrating EXCELLENCE in ${windowPriorities.title} performance monitoring.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Indicators must directly measure ${windowPriorities.title} progress and impact
    🏗️ MATURITY CRITERIA: Realistic measurement approach considering municipal data collection capacity

    REQUIRED MEASUREMENT FRAMEWORK:

    1. QUANTITATIVE INDICATORS (Window-Specific)
       • Primary indicators: ${windowPriorities.keyAreas[0]} performance metrics with numerical targets
       • Secondary indicators: ${windowPriorities.keyAreas[1]} impact measurements
       • Financial indicators: cost-effectiveness, efficiency ratios, budget execution rates
       • Beneficiary indicators: numbers served, satisfaction rates, participation levels

    2. QUALITATIVE ASSESSMENT CRITERIA
       • Quality improvements in ${windowPriorities.keyAreas[0]} service delivery
       • Stakeholder satisfaction and feedback mechanisms
       • Institutional capacity enhancement assessments
       • Sustainability and ownership development indicators

    3. EU COMPLIANCE INDICATORS
       • Alignment with ${windowPriorities.title} specific targets and benchmarks
       • Contribution to regional development and EU accession progress
       • Environmental and social compliance metrics (where applicable)
       • Cross-border cooperation effectiveness (for territorial cooperation projects)

    4. DATA COLLECTION METHODOLOGY
       • Baseline studies and data collection protocols
       • Monitoring frequency: monthly operational, quarterly outcome, annual impact
       • Data sources: municipal records, beneficiary surveys, expert assessments
       • Quality assurance and validation procedures

    OBJECTIVE REFERENCE: "${context.smartObjectives?.specific || context.objectives || 'project objectives targeting ' + windowPriorities.title}"

    MEASUREMENT TARGETS: Include specific numerical targets, improvement percentages, and timeline-based milestones`,

    smartAchievable: `Demonstrate ACHIEVABILITY (300-500 words) providing EXCELLENCE in ${windowPriorities.title} implementation feasibility analysis.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Demonstrate realistic capacity for ${windowPriorities.title} objective delivery
    🏗️ MATURITY CRITERIA: Honest assessment of municipal readiness and implementation capacity

    REQUIRED ACHIEVABILITY ANALYSIS:

    1. RESOURCE ADEQUACY ASSESSMENT
       • Budget sufficiency: €${context.budget || 'TBD'} allocation analysis for ${windowPriorities.keyAreas[0]} activities
       • Human resource capacity: municipal staff expertise and availability
       • Technical resource requirements: equipment, technology, infrastructure needs
       • Co-financing commitments: municipal contribution and sustainability planning

    2. INSTITUTIONAL CAPACITY EVALUATION
       • Municipal organizational readiness for ${windowPriorities.title} implementation
       • Past experience with EU projects and similar initiatives in ${context.municipality || 'the municipality'}
       • Institutional learning capacity and knowledge management systems
       • Leadership commitment and political support sustainability

    3. PARTNERSHIP & SUPPORT NETWORK
       • Strategic partnerships with national institutions and regional organizations
       • Technical assistance availability from EU and international experts
       • Civil society and private sector engagement capacity
       • Regional cooperation potential (especially for cross-border initiatives)

    4. IMPLEMENTATION FEASIBILITY (${context.duration || '24'} months)
       • Timeline realism considering procurement, construction, and capacity building phases
       • Seasonal factors and local context considerations
       • Regulatory approval processes and compliance requirements
       • Risk mitigation capacity and contingency planning

    5. WESTERN BALKAN CONTEXT FACTORS
       • Regional economic conditions and market readiness
       • EU accession process alignment and policy stability
       • Cross-border cooperation facilitation (where relevant)
       • Local stakeholder buy-in and community support levels

    WINDOW-SPECIFIC FEASIBILITY:
    ${windowPriorities.description}

    QUALITY EVIDENCE: Include specific examples, reference similar successful projects, provide concrete capacity indicators`,

    smartRelevant: `Demonstrate RELEVANCE (300-500 words) showing EXCELLENCE in ${windowPriorities.title} strategic alignment and policy coherence.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Perfect alignment with IPA III ${windowPriorities.title} priorities and EU policy objectives
    🏗️ MATURITY CRITERIA: Clear understanding of policy frameworks and strategic development needs

    REQUIRED RELEVANCE DEMONSTRATION:

    1. IPA III WINDOW ALIGNMENT (Primary Priority)
       • Direct contribution to ${windowPriorities.title} specific objectives and targets
       • Alignment with key focus areas: ${windowPriorities.keyAreas.join(', ')}
       • Measurable contribution to window performance indicators and benchmarks
       • Integration with other IPA III programming priorities and synergies

    2. EU POLICY FRAMEWORK INTEGRATION
       • European Green Deal alignment (for environment/climate projects)
       • Digital Decade 2030 targets (for digital transformation initiatives)
       • European Pillar of Social Rights (for social inclusion projects)
       • EU Western Balkans Strategy 2020-2025 specific objectives

    3. NATIONAL & LOCAL DEVELOPMENT PRIORITIES
       • National development strategies and EU accession planning alignment
       • Municipal development plans and strategic priorities in ${context.municipality || 'the municipality'}
       • Regional development needs and cross-border cooperation priorities
       • Contribution to national sectoral policies and reform agendas

    4. STAKEHOLDER NEEDS & DEVELOPMENT GAPS
       • Evidence-based needs assessment demonstrating intervention necessity
       • Beneficiary consultation results and demand validation
       • Gap analysis showing current service/capacity deficits
       • Market failure or public good provision challenges addressed

    5. LONG-TERM STRATEGIC VALUE
       • Contribution to sustainable development goals (SDGs) and EU 2030 targets
       • Institutional capacity building and knowledge economy development
       • Regional competitiveness and economic integration enhancement
       • Environmental sustainability and climate resilience building

    WINDOW-SPECIFIC RELEVANCE:
    ${windowPriorities.description}

    EVIDENCE BASE: Include specific policy references, statistical data supporting need, stakeholder consultation results`,

    smartTimeBound: `Create detailed TIME-BOUND implementation schedule (400-600 words) demonstrating EXCELLENCE in ${windowPriorities.title} project planning and milestone management.

    PERFORMANCE-BASED REQUIREMENTS:
    🎯 RELEVANCE CRITERIA: Timeline must optimize ${windowPriorities.title} outcome delivery and impact achievement
    🏗️ MATURITY CRITERIA: Realistic scheduling considering municipal capacity and implementation complexity

    REQUIRED TIMELINE STRUCTURE (${context.duration || '24'} months):

    PHASE 1: PREPARATION & MOBILIZATION (Months 1-6)
    • Month 1-2: Project launch, stakeholder engagement, partnership agreements
    • Month 3-4: Baseline studies, needs assessments, detailed planning
    • Month 5-6: Procurement processes, staff recruitment, capacity building initiation
    • Key Milestone: Implementation readiness assessment and approval

    PHASE 2: CORE IMPLEMENTATION (Months 7-18)
    • Month 7-9: ${windowPriorities.keyAreas[0]} activity implementation and infrastructure development
    • Month 10-12: ${windowPriorities.keyAreas[1]} interventions and system integration
    • Month 13-15: Pilot implementation, testing, and quality assurance
    • Month 16-18: Full-scale implementation and service delivery launch
    • Key Milestones: Mid-term evaluation, performance target achievement verification

    PHASE 3: CONSOLIDATION & EVALUATION (Months 19-24)
    • Month 19-21: Impact assessment, sustainability planning, knowledge transfer
    • Month 22-23: Final evaluations, reporting, and dissemination activities
    • Month 24: Project closure, handover, and sustainability mechanism activation
    • Key Milestone: Final evaluation and sustainability certification

    CRITICAL PATH ACTIVITIES:
    • EU procurement compliance and vendor selection processes
    • Municipal capacity building and staff training programs
    • Technology implementation and system integration phases
    • Stakeholder consultation and community engagement milestones

    MONITORING & REPORTING SCHEDULE:
    • Monthly operational reports and financial monitoring
    • Quarterly progress reviews and stakeholder meetings
    • Semi-annual EU reporting and compliance assessments
    • Annual impact evaluations and adaptive management reviews

    PROJECT REFERENCE: ${context.objectives ? context.objectives.substring(0, 300) : 'project objectives targeting ' + windowPriorities.title}

    WINDOW-SPECIFIC TIMELINE CONSIDERATIONS:
    ${windowPriorities.description}

    QUALITY STANDARDS: Include buffer time for risk mitigation, realistic procurement timelines, seasonal considerations, regulatory approval processes`,

    budget: `Create a comprehensive budget plan (400-600 words) demonstrating EXCELLENCE in ${windowPriorities.title} financial planning and resource allocation.

    🎯 ULTRATHINK RESOURCE OPTIMIZATION INTELLIGENCE:
    📊 Recommended Total Budget: €${resourceOptimization.budget.recommendedTotal.toLocaleString()}
    💰 Budget Breakdown Guidance:
    • Personnel: €${resourceOptimization.budget.breakdown.personnel.toLocaleString()} (${Math.round((resourceOptimization.budget.breakdown.personnel/resourceOptimization.budget.recommendedTotal)*100)}%)
    • Equipment: €${resourceOptimization.budget.breakdown.equipment.toLocaleString()} (${Math.round((resourceOptimization.budget.breakdown.equipment/resourceOptimization.budget.recommendedTotal)*100)}%)
    • Services: €${resourceOptimization.budget.breakdown.services.toLocaleString()} (${Math.round((resourceOptimization.budget.breakdown.services/resourceOptimization.budget.recommendedTotal)*100)}%)
    • Infrastructure: €${resourceOptimization.budget.breakdown.infrastructure.toLocaleString()} (${Math.round((resourceOptimization.budget.breakdown.infrastructure/resourceOptimization.budget.recommendedTotal)*100)}%)

    🤝 Co-financing Structure:
    • EU Contribution: ${resourceOptimization.budget.coFinancingStructure.euContribution}%
    • National/Municipal: ${resourceOptimization.budget.coFinancingStructure.nationalContribution + resourceOptimization.budget.coFinancingStructure.municipalContribution}%

    REQUIRED BUDGET STRUCTURE:
    1. TOTAL PROJECT COST with clear justification for the recommended amount
    2. DETAILED BREAKDOWN by categories aligned with IPA III standards
    3. CO-FINANCING PLAN demonstrating financial sustainability and commitment
    4. COST-EFFECTIVENESS ANALYSIS showing value for money
    5. BUDGET NARRATIVE explaining major cost drivers and resource needs
    6. RISK CONTINGENCY provisions (5-10% of total budget)

    OPTIMIZATION REQUIREMENTS:
    • Align budget with ${windowPriorities.title} investment priorities
    • Demonstrate cost-effectiveness and value creation
    • Show realistic resource allocation for ${context.municipality || 'municipal'} capacity
    • Include specific justification for major budget lines
    • Address sustainability of investments beyond project completion

    PROJECT CONTEXT:
    ${filledSections}

    INTELLIGENCE-GUIDED BUDGETING: Use the resource optimization data to create a realistic, well-justified budget that demonstrates professional financial planning aligned with EU standards and municipal capacity.`,

    duration: `Create a comprehensive project duration and timeline plan (300-500 words) demonstrating EXCELLENCE in ${windowPriorities.title} implementation planning.

    🎯 ULTRATHINK TIMELINE OPTIMIZATION INTELLIGENCE:
    ⏱️ Recommended Duration: ${resourceOptimization.timeline.recommendedDuration} months
    📅 Optimized Phase Structure:
    ${resourceOptimization.timeline.phases.map(phase =>
      `• ${phase.name}: ${phase.duration} months (${Math.round(phase.budget * 100)}% budget)`
    ).join('\n    ')}

    🚨 Critical Path: ${resourceOptimization.timeline.criticalPath.slice(0, 3).join(', ')}
    ⚡ Buffer Time: ${resourceOptimization.timeline.bufferTime}% recommended for risk mitigation

    REQUIRED TIMELINE STRUCTURE:
    1. TOTAL PROJECT DURATION with clear justification
    2. DETAILED PHASE BREAKDOWN with specific start/end dates and milestones
    3. CRITICAL PATH ANALYSIS identifying key dependencies
    4. RISK BUFFER allocation for unexpected delays
    5. SEASONAL CONSIDERATIONS affecting implementation
    6. PROCUREMENT TIMELINE accounting for EU compliance requirements

    TIMING OPTIMIZATION:
    • Align timeline with ${windowPriorities.title} implementation complexity
    • Consider ${context.municipality || 'municipal'} administrative capacity
    • Account for stakeholder coordination requirements
    • Plan for EU reporting and evaluation cycles
    • Include adequate testing and quality assurance periods

    QUALITY REQUIREMENTS: Create realistic timeline that balances ambition with feasibility, includes proper risk management, and demonstrates professional project planning expertise.`
  }

  return basePrompts[field] || basePrompts.description
}

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const REQUEST_TIMEOUT = 30000 // 30 seconds

// Helper function for exponential backoff delay
function getRetryDelay(attempt: number): number {
  return RETRY_DELAY * Math.pow(2, attempt)
}

// Helper function to make API request with timeout
async function makeAPIRequest(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Validate API response structure
function validateAPIResponse(data: any): boolean {
  return data &&
         data.choices &&
         Array.isArray(data.choices) &&
         data.choices.length > 0 &&
         data.choices[0].message &&
         typeof data.choices[0].message.content === 'string'
}

export async function generateAIContent(request: AIRequest): Promise<AIResponse> {
  const { field, projectContext, language, projectId } = request

  // Check cache first
  const cacheKey = await generateCacheKey(field, projectContext)
  const cachedResponse = await getCachedResponse(cacheKey)

  if (cachedResponse) {
    return {
      suggestion: cachedResponse,
      cached: true,
      source: 'cache'
    }
  }

  // Generate new content with context awareness
  const contextPrompt = getContextAwarePrompt(field, projectContext)

  // Language-specific system prompt with stronger directives
  const languageName = getLanguageName(language)
  const isNonEnglish = language !== 'en'

  // Enhanced language directive for Albanian and other languages
  let languageInstruction = ''
  if (isNonEnglish) {
    languageInstruction = `CRITICAL REQUIREMENT: You MUST write your ENTIRE response in ${languageName} language only.
    Do NOT use English or any other language. Every single word must be in ${languageName}.
    If you cannot generate content in ${languageName}, return an error message in ${languageName}.`
  }

  // 🚀 ULTRATHINK: Multi-Expert Council with Cross-Window Synergy Intelligence
  const multiExpertConsultation = getMultiExpertPrompt(projectContext, field, language);

  // Enhanced logging for synergy detection
  const synergies = detectWindowSynergies(projectContext);
  console.log(`🔄 Synergy Analysis - Primary: ${synergies.primaryWindow}, Synergies: [${synergies.synergyWindows.join(', ')}], Score: ${Math.round(synergies.synergyScore * 100)}%`);

  // 🌍 ULTRATHINK: Municipality Intelligence Integration
  const municipalityIntelligence = generateMunicipalityIntelligence(projectContext.municipality || '', projectContext);
  console.log(`🌍 Municipality Intelligence - ${projectContext.municipality}: ${municipalityIntelligence.profile ? 'Profile Found' : 'Generic Profile'}, Challenges: ${municipalityIntelligence.relevantChallenges.length}, Opportunities: ${municipalityIntelligence.alignedOpportunities.length}`);

  // 🎯 ULTRATHINK: Intelligent Resource Optimization
  const resourceOptimization = optimizeProjectResources(projectContext, projectContext.municipality || '', projectContext.ipaWindow || 'window3');
  console.log(`🎯 Resource Optimization - Budget: €${resourceOptimization.budget.recommendedTotal.toLocaleString()}, Timeline: ${resourceOptimization.timeline.recommendedDuration}m, Confidence: ${Math.round(resourceOptimization.confidence * 100)}%`);

  const requestBody = {
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    messages: [
      {
        role: 'system',
        content: `${multiExpertConsultation.enhancedPrompt}

🎯 ULTRATHINK PERFORMANCE-BASED ASSESSMENT APPROACH:
• RELEVANCE CRITERIA: Ensure all content directly aligns with IPA III window priorities and EU policy objectives
• MATURITY CRITERIA: Consider implementation readiness, institutional capacity, and realistic timelines
• SYNERGY OPTIMIZATION: Leverage cross-window synergies for multiplicative impact (Score: ${Math.round(synergies.synergyScore * 100)}%)
• WESTERN BALKAN FOCUS: Address specific regional challenges and opportunities in your recommendations
• MUNICIPAL EXCELLENCE: Provide actionable guidance tailored to municipal-level implementation

🚀 ENHANCED CONTENT GENERATION GUIDELINES:
${languageInstruction}
CRITICAL REQUIREMENTS:
• Always build upon and reference the existing project information provided
• Create coherent, interconnected content that forms a complete application
• Each section should reference and align with previous sections
• Demonstrate deep understanding of EU funding requirements and assessment criteria
• ${synergies.synergyWindows.length > 0 ? `EXPLOIT CROSS-WINDOW SYNERGIES: Integrate ${synergies.synergyWindows.join(' and ')} elements for enhanced impact` : 'Focus on window-specific excellence'}
• Apply ULTRATHINK methodology for maximum proposal quality and funding success probability`
      },
      {
        role: 'user',
        content: `${enhancePromptWithMunicipalityIntelligence(contextPrompt, projectContext.municipality || '', projectContext)}

        ${isNonEnglish ? `MANDATORY: Your response must be written entirely in ${languageName} language. No English allowed.` : ''}

        🚀 ULTRATHINK CONTENT REQUIREMENTS:
        • Provide comprehensive, detailed, and practical content suitable for an EU funding application
        • Your response should be thorough and well-structured with multiple paragraphs, specific details, and concrete examples
        • Integrate municipality-specific intelligence and local context throughout your response
        • Reference specific local conditions, demographics, infrastructure, and opportunities
        • Demonstrate deep understanding of the municipality's unique challenges and strategic priorities
        • Apply cross-window synergies where detected (Score: ${Math.round(synergies.synergyScore * 100)}%)
        • Aim for detailed, professional content that fully addresses the field requirements with local relevance
        • Show how the project aligns with the municipality's strategic development priorities`
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }

  // Retry logic with exponential backoff
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`AI generation attempt ${attempt + 1}/${MAX_RETRIES} for field: ${field}, language: ${language}`)

      const response = await makeAPIRequest(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mefa-platform.eu',
          'X-Title': 'MEFA Platform'
        },
        body: JSON.stringify(requestBody)
      }, REQUEST_TIMEOUT)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`AI API Error (attempt ${attempt + 1}):`, response.status, response.statusText, errorText)

        // Don't retry for certain error codes
        if (response.status === 401 || response.status === 403) {
          throw new Error(`API Authentication Error: ${response.status}`)
        }

        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const responseText = await response.text()

      // Better JSON parsing with validation
      if (!responseText.trim()) {
        throw new Error('Empty response from AI service')
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error(`JSON Parse Error (attempt ${attempt + 1}):`, parseError)
        console.error('Response text:', responseText.substring(0, 500) + '...')
        throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`)
      }

      // Validate response structure
      if (!validateAPIResponse(data)) {
        console.error('Invalid API response structure:', data)
        throw new Error('API returned invalid response structure')
      }

      const suggestion = data.choices[0].message.content.trim()

      if (!suggestion) {
        throw new Error('API returned empty content')
      }

      // Success! Cache and save the response
      await cacheResponse(cacheKey, field, projectContext, suggestion, 'meta-llama/llama-3.2-3b-instruct:free')

      // Only save to AIResponse if we have a valid project ID and it exists
      if (projectId) {
        try {
          await prisma.aIResponse.create({
            data: {
              projectId,
              field,
              prompt: contextPrompt,
              response: suggestion,
              language,
              model: 'meta-llama/llama-3.2-3b-instruct:free'
            }
          })
        } catch (dbError) {
          // Log but don't fail the request if database save fails
          console.log(`Database save failed for project ${projectId}, continuing without saving to AIResponse table:`, dbError instanceof Error ? dbError.message : 'Unknown error')
        }
      }

      console.log(`AI generation successful for field: ${field}, language: ${language}`)
      return {
        suggestion,
        cached: false,
        source: 'ai'
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`AI generation error (attempt ${attempt + 1}/${MAX_RETRIES}):`, lastError.message)

      // Don't retry on the last attempt
      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt)
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed - use language-aware fallback
  console.error(`All ${MAX_RETRIES} attempts failed. Using fallback response.`, lastError?.message)

  return {
    suggestion: getFallbackSuggestion(field, language),
    cached: false,
    source: 'error'
  }
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    sq: 'Albanian',
    bs: 'Bosnian',
    hr: 'Croatian',
    mk: 'Macedonian',
    me: 'Montenegrin',
    sr: 'Serbian',
    tr: 'Turkish'
  }
  return languages[code] || 'English'
}

function getFallbackSuggestion(field: string, language: string = 'en'): string {
  const fallbacks: Record<string, Record<string, string>> = {
    en: {
      description: 'This innovative municipal project aims to enhance local governance and service delivery through sustainable development initiatives.',
      objectives: '1. Improve municipal services and infrastructure\n2. Enhance citizen engagement and participation\n3. Build local institutional capacity',
      methodology: 'The project will be implemented through a phased approach with stakeholder consultation and regular monitoring.',
      risks: 'Technical risks: System integration challenges\nOrganizational risks: Change management\nFinancial risks: Budget constraints',
      sustainability: 'Financial sustainability through improved efficiency and cost savings. Institutional sustainability through capacity building.',
      smartSpecific: 'Define specific, measurable outcomes that align with municipal development goals.',
      smartMeasurable: 'Establish clear indicators and metrics to track project progress and success.',
      smartAchievable: 'Ensure objectives are realistic within available resources and timeframe.',
      smartRelevant: 'Align project objectives with IPA III priorities and local development needs.',
      smartTimeBound: 'Set clear timelines and milestones for project implementation phases.'
    },
    sq: {
      description: 'Ky projekt novator komunal synon të përmirësojë qeverisjen vendore dhe ofrimin e shërbimeve përmes iniciativave të zhvillimit të qëndrueshëm.',
      objectives: '1. Përmirësimi i shërbimeve dhe infrastrukturës komunale\n2. Forcimi i angazhimit dhe pjesëmarrjes së qytetarëve\n3. Ndërtimi i kapaciteteve institucionale lokale',
      methodology: 'Projekti do të zbatohet përmes një qasjeje me faza me konsultim të palëve të interesuara dhe monitorim të rregullt.',
      risks: 'Rreziqe teknike: Sfidat e integrimit të sistemit\nRreziqe organizative: Menaxhimi i ndryshimeve\nRreziqe financiare: Kufizimet e buxhetit',
      sustainability: 'Qëndrueshmëria financiare përmes përmirësimit të efikasitetit dhe kursimit të kostove. Qëndrueshmëria institucionale përmes ndërtimit të kapaciteteve.',
      smartSpecific: 'Përcaktoni rezultate specifike dhe të matshme që përputhen me objektivat e zhvillimit komunal.',
      smartMeasurable: 'Vendosni tregues dhe metrika të qarta për të ndjekur progresin dhe suksesin e projektit.',
      smartAchievable: 'Sigurohuni që objektivat janë reale brenda burimeve dhe kohës së disponueshme.',
      smartRelevant: 'Harmonizoni objektivat e projektit me prioritetet e IPA III dhe nevojat e zhvillimit lokal.',
      smartTimeBound: 'Vendosni afate dhe shkallë të qarta për fazat e zbatimit të projektit.'
    },
    bs: {
      description: 'Ovaj inovativni opštinski projekat ima za cilj poboljšanje lokalne uprave i pružanja usluga kroz inicijative održivog razvoja.',
      objectives: '1. Poboljšanje opštinskih usluga i infrastrukture\n2. Jačanje angažmana i učešća građana\n3. Izgradnja lokalnih institucionalnih kapaciteta',
      methodology: 'Projekat će biti implementiran kroz postupni pristup sa konsultacijama zainteresovanih strana i redovnim monitoringom.',
      risks: 'Tehnički rizici: Izazovi integracije sistema\nOrganizacijski rizici: Upravljanje promjenama\nFinansijski rizici: Budžetska ograničenja',
      sustainability: 'Finansijska održivost kroz poboljšanu efikasnost i uštede troškova. Institucionalna održivost kroz izgradnju kapaciteta.',
      smartSpecific: 'Definirajte specifične, mjerljive ishode koji se slažu sa ciljevima opštinskog razvoja.',
      smartMeasurable: 'Uspostavite jasne indikatore i metrike za praćenje napretka i uspjeha projekta.',
      smartAchievable: 'Osigurajte da su ciljevi realni u okviru dostupnih resursa i vremenskog okvira.',
      smartRelevant: 'Uskladite ciljeve projekta sa prioritetima IPA III i potrebama lokalnog razvoja.',
      smartTimeBound: 'Postavite jasne rokove i prekretnice za faze implementacije projekta.'
    },
    hr: {
      description: 'Ovaj inovativni općinski projekt ima za cilj poboljšanje lokalne uprave i pružanja usluga kroz inicijative održivog razvoja.',
      objectives: '1. Poboljšanje općinskih usluga i infrastrukture\n2. Jačanje angažmana i sudjelovanja građana\n3. Izgradnja lokalnih institucionalnih kapaciteta',
      methodology: 'Projekt će biti implementiran kroz postupni pristup s konzultacijama zainteresiranih strana i redovitim monitoringom.',
      risks: 'Tehnički rizici: Izazovi integracije sustava\nOrganizacijski rizici: Upravljanje promjenama\nFinancijski rizici: Proračunska ograničenja',
      sustainability: 'Financijska održivost kroz poboljšanu efikasnost i uštede troškova. Institucionalna održivost kroz izgradnju kapaciteta.',
      smartSpecific: 'Definirajte specifične, mjerljive ishode koji se slažu s ciljevima općinskog razvoja.',
      smartMeasurable: 'Uspostavite jasne indikatore i metrike za praćenje napretka i uspjeha projekta.',
      smartAchievable: 'Osigurajte da su ciljevi realni u okviru dostupnih resursa i vremenskog okvira.',
      smartRelevant: 'Uskladite ciljeve projekta s prioritetima IPA III i potrebama lokalnog razvoja.',
      smartTimeBound: 'Postavite jasne rokove i prekretnice za faze implementacije projekta.'
    },
    mk: {
      description: 'Овој иновативен општински проект има за цел подобрување на локалната управа и пружање услуги преку иницијативи за одржлив развој.',
      objectives: '1. Подобрување на општинските услуги и инфраструктура\n2. Зајакнување на ангажманот и учеството на граѓаните\n3. Изградба на локални институционални капацитети',
      methodology: 'Проектот ќе биде имплементиран преку постепен пристап со консултации на заинтересираните страни и редовно следење.',
      risks: 'Технички ризици: Предизвици за интеграција на системот\nОрганизациски ризици: Управување со промени\nФинансиски ризици: Буџетски ограничувања',
      sustainability: 'Финансиска одржливост преку подобрена ефикасност и заштеди на трошоци. Институционална одржливост преку изградба на капацитети.',
      smartSpecific: 'Дефинирајте специфични, мерливи исходи што се усогласуваат со целите на општинскиот развој.',
      smartMeasurable: 'Воспоставете јасни индикатори и метрики за следење на напредокот и успехот на проектот.',
      smartAchievable: 'Обезбедете дека целите се реални во рамките на достапните ресурси и временски рамки.',
      smartRelevant: 'Усогласете ги целите на проектот со приоритетите на IPA III и потребите за локален развој.',
      smartTimeBound: 'Поставете јасни рокови и прекретници за фазите на имплементација на проектот.'
    },
    me: {
      description: 'Ovaj inovativni opštinski projekat ima za cilj poboljšanje lokalne uprave i pružanja usluga kroz inicijative održivog razvoja.',
      objectives: '1. Poboljšanje opštinskih usluga i infrastrukture\n2. Jačanje angažmana i učešća građana\n3. Izgradnja lokalnih institucionalnih kapaciteta',
      methodology: 'Projekat će biti implementiran kroz postupni pristup sa konsultacijama zainteresovanih strana i redovnim monitoringom.',
      risks: 'Tehnički rizici: Izazovi integracije sistema\nOrganizacijski rizici: Upravljanje promjenama\nFinansijski rizici: Budžetska ograničenja',
      sustainability: 'Finansijska održivost kroz poboljšanu efikasnost i uštede troškova. Institucionalna održivost kroz izgradnju kapaciteta.',
      smartSpecific: 'Definirajte specifične, mjerljive ishode koji se slažu sa ciljevima opštinskog razvoja.',
      smartMeasurable: 'Uspostavite jasne indikatore i metrike za praćenje napretka i uspjeha projekta.',
      smartAchievable: 'Osigurajte da su ciljevi realni u okviru dostupnih resursa i vremenskog okvira.',
      smartRelevant: 'Uskladite ciljeve projekta sa prioritetima IPA III i potrebama lokalnog razvoja.',
      smartTimeBound: 'Postavite jasne rokove i prekretnice za faze implementacije projekta.'
    },
    sr: {
      description: 'Овај иновативни општински пројекат има за циљ побољшање локалне управе и пружање услуга кроз иницијативе одрживог развоја.',
      objectives: '1. Побољшање општинских услуга и инфраструктуре\n2. Јачање ангажмана и учешћа грађана\n3. Изградња локалних институционалних капацитета',
      methodology: 'Пројекат ће бити имплементиран кроз поступни приступ са консултацијама заинтересованих страна и редовним мониторингом.',
      risks: 'Технички ризици: Изазови интеграције система\nОрганизациони ризици: Управљање променама\nФинансијски ризици: Буџетска ограничења',
      sustainability: 'Финансијска одрживост кроз побољшану ефикасност и уштеде трошкова. Институционална одрживост кроз изградњу капацитета.',
      smartSpecific: 'Дефинишите специфичне, мерљиве исходе који се слажу са циљевима општинског развоја.',
      smartMeasurable: 'Успоставите јасне индикаторе и метрике за праћење напретка и успеха пројекта.',
      smartAchievable: 'Осигурајте да су циљеви реални у оквиру доступних ресурса и временског оквира.',
      smartRelevant: 'Усkladите циљеве пројекта са приоритетима ИПА III и потребама локалног развоја.',
      smartTimeBound: 'Поставите јасне рокове и прекретнице за фазе имплементације пројекта.'
    },
    tr: {
      description: 'Bu yenilikçi belediye projesi, sürdürülebilir kalkınma girişimleri aracılığıyla yerel yönetişimi ve hizmet sunumunu geliştirmeyi amaçlamaktadır.',
      objectives: '1. Belediye hizmetlerini ve altyapısını geliştirmek\n2. Vatandaş katılımını ve etkileşimini güçlendirmek\n3. Yerel kurumsal kapasiteyi inşa etmek',
      methodology: 'Proje, paydaş konsültasyonları ve düzenli izleme ile aşamalı bir yaklaşımla uygulanacaktır.',
      risks: 'Teknik riskler: Sistem entegrasyonu zorlukları\nKurumsal riskler: Değişim yönetimi\nFinansal riskler: Bütçe kısıtlamaları',
      sustainability: 'Gelişmiş verimlilik ve maliyet tasarrufları ile finansal sürdürülebilirlik. Kapasite geliştirme ile kurumsal sürdürülebilirlik.',
      smartSpecific: 'Belediye kalkınma hedefleriyle uyumlu spesifik, ölçülebilir sonuçlar tanımlayın.',
      smartMeasurable: 'Proje ilerlemesini ve başarısını izlemek için net göstergeler ve metrikler oluşturun.',
      smartAchievable: 'Hedeflerin mevcut kaynaklar ve zaman çerçevesi içinde gerçekçi olduğunu sağlayın.',
      smartRelevant: 'Proje hedeflerini IPA III öncelikleri ve yerel kalkınma ihtiyaçları ile uyumlu hale getirin.',
      smartTimeBound: 'Proje uygulama aşamaları için net zaman çizelgeleri ve kilometre taşları belirleyin.'
    }
  }

  const languageFallbacks = fallbacks[language] || fallbacks['en']
  return languageFallbacks[field] || languageFallbacks['description'] || 'Please provide more context for better suggestions.'
}

// Auto-fill entire section
export async function autoFillSection(
  sectionName: string,
  fields: string[],
  projectContext: any,
  projectId?: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const field of fields) {
    const response = await generateAIContent({
      field,
      projectContext: { ...projectContext, ...results }, // Include previous results
      language: projectContext.language || 'en',
      projectId
    })

    results[field] = response.suggestion

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}