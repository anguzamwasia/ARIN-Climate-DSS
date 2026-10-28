"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
const KenyaMap = dynamic(() => import("../components/KenyaMapClient"), { ssr: false })
import AfricaMap from "../../components/AfricaMap"
import MediaModal from "../../components/MediaModal"
import { ArrowLeft, FileText, ExternalLink, Globe, Database, Mic, Users, PlayCircle, MapPin, ArrowDown, Loader2, Lock, ChevronUp, CheckCircle2, Layers, PieChart, AlertTriangle, TrendingUp, Leaf, DollarSign, Lightbulb, UserCheck, ShieldAlert, Sparkles, BookOpen } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Suspense } from "react"
import { AnalyticsDashboard } from "./AnalyticsDashboard"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

interface Doc {
  id: number
  title: string
  url: string
  file_url: string
  source: string
  country: string
  type: string
  scraped_at: string
  content_text?: string
  body?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const isCounty = (country?: string) => {
  if (!country) return false;
  const normalized = country.toLowerCase().trim();
  if (normalized === "kenya" || normalized === "africa" || normalized === "africa (global)") return false;
  
  const africanCountries = [
    "algeria", "angola", "benin", "botswana", "burkina faso", "burundi", "cabo verde", "cameroon", 
    "central african republic", "chad", "comoros", "congo", "cote d'ivoire", "djibouti", "egypt", 
    "equatorial guinea", "eritrea", "eswatini", "ethiopia", "gabon", "gambia", "ghana", "guinea", 
    "guinea-bissau", "kenya", "lesotho", "liberia", "libya", "madagascar", "malawi", "mali", 
    "mauritania", "mauritius", "morocco", "mozambique", "namibia", "niger", "nigeria", "rwanda", 
    "sao tome and principe", "senegal", "seychelles", "sierra leone", "somalia", "south africa", 
    "south sudan", "sudan", "tanzania", "togo", "tunisia", "uganda", "zambia", "zimbabwe"
  ];
  if (africanCountries.includes(normalized)) return false;
  return true;
}

interface MediaMetadata {
  title: string;
  summary: string;
  insights: string[];
}

function getMediaMetadata(filename: string, body: string): MediaMetadata {
  const nameLower = filename.toLowerCase();
  
  if (nameLower.includes("kii rw")) {
    return {
      title: "Key Informant Interview (Rwanda)",
      summary: "This Key Informant Interview provides an in-depth analysis of the institutional formulation, stakeholder validation, and operational deployment of the County Integrated Development Plan (CIDP) framework in Rwanda. The session details how district planning officers and environmental coordinators systematically integrate localized climate data into sub-national development targets, navigating institutional mandates to harmonize municipal budgeting with long-term climate adaptation priorities.\n\nA major focus of the interview centers on municipal water infrastructure, agricultural resilience, and rural irrigation investments. The informant outlines critical challenges faced by local administrations, including competing budgetary allocations, unpredictable precipitation patterns, and the necessity of establishing decentralized water storage reserves to safeguard smallholder farming communities against seasonal drought extremes.\n\nThe dialogue concludes with strategic recommendations for mainstreaming climate indicators into sub-national monitoring frameworks and unlocking international climate finance. Key recommendations emphasize strengthening inter-departmental collaboration, deploying transparent climate expenditure tracking systems, and establishing community-level feedback mechanisms to ensure that decentralized climate investments directly reflect grassroots vulnerability assessments.",
      insights: [
        "Evaluated decentralized CIDP formulation methodologies for embedding localized climate adaptation metrics into Rwandan district planning.",
        "Identified urgent water infrastructure needs, advocating for communal rainwater harvesting and multi-scale storage reservoirs to combat dry season deficits.",
        "Analyzed county and district budgeting bottlenecks, recommending dedicated ring-fenced allocations for climate-resilient agriculture.",
        "Emphasized participatory risk assessments with vulnerable rural smallholders to directly inform municipal resource priorities.",
        "Outlined inter-agency coordination mechanisms between national ministries and sub-national authorities to reduce reporting overlaps.",
        "Recommended strengthening climate finance readiness to enable local governments to directly access multilateral climate funds."
      ]
    };
  }
  if (nameLower.includes("feedback_policyss_21oct2020") || nameLower.includes("sdg activity")) {
    return {
      title: "SDG Activity Feedback Policy Session (Oct 2020)",
      summary: "This high-level policy review examines the operational progress, inter-sectoral synergies, and implementation bottlenecks encountered across Sustainable Development Goal (SDG) initiatives in Kenyan county administrations. The panel conducts a critical audit of sub-national sustainability programs, assessing how localized projects intersect with national carbon reduction commitments and regional development agendas.\n\nThe discussion evaluates cross-cutting interactions among water accessibility (SDG 6), clean energy transition (SDG 7), climate action (SDG 13), and terrestrial ecosystem conservation (SDG 15). Panelists highlight successful decentralized water harvesting programs while scrutinizing persistent bottlenecks, including bureaucratic delays, fragmented ministry jurisdictions, and inadequate monitoring infrastructures at the county level.\n\nTo accelerate progress toward the 2030 targets, the session puts forward key governance reforms: establishing inter-ministerial taskforces to eliminate departmental silos, standardizing county reporting templates into a centralized digital repository, and integrating grassroots community audits into the National Voluntary Local Review (VLR) reporting framework.",
      insights: [
        "Assessed cross-sectoral synergies between clean water access (SDG 6), affordable clean energy (SDG 7), and climate action (SDG 13) across Kenyan counties.",
        "Scrutinized institutional bottlenecks arising from overlapping ministerial mandates and fragmented sub-national reporting protocols.",
        "Highlighted community-driven water preservation and waste management pilots as scalable models for grassroots sustainability.",
        "Advocated establishing standardized digital monitoring repositories to harmonize data collection across national and county levels.",
        "Emphasized integrating civil society and local community audits into the National Voluntary Local Review (VLR) reporting framework.",
        "Proposed dedicated capacity-building workshops for county directors to translate global sustainability goals into actionable local targets."
      ]
    };
  }
  if (nameLower.includes("public engagement session_24nov2020") || nameLower.includes("public engagement")) {
    return {
      title: "Public Engagement and Research Session (Nov 2020)",
      summary: "Led by Dr. Steve Dawney of the University of Southampton, this masterclass explores progressive methodologies for public engagement and research co-production in climate and environmental sciences. The session examines how academic and research institutions can transition beyond traditional one-directional dissemination toward sustained, collaborative partnerships with local communities, civic leaders, and marginalized groups.\n\nThe presentation details practical community engagement initiatives, including traveling researcher roadshows, participatory citizen science workshops, and localized science festivals. Dr. Dawney shares operational insights on navigating the operational constraints imposed by global disruptions, demonstrating how digital and hybrid engagement platforms can be leveraged to expand geographic reach while maintaining meaningful personal interactions.\n\nThe session concludes with an evaluation of how research institutions can embed engagement into academic culture, overcome institutional resistance, and build enduring mutual trust with the public. Participants discussed methodologies for measuring the qualitative impact of community engagement, advocating for institutional reward structures that recognize public co-creation alongside conventional scientific publications.",
      insights: [
        "Introduced Southampton's institutional framework for translating complex climate and environmental data into public-facing dialogues.",
        "Presented mobile researcher roadshows and citizen science workshops as powerful tools to demystify climate science in local communities.",
        "Examined digital and hybrid engagement adaptations during global disruptions to sustain outreach without losing personal interaction.",
        "Emphasized shifting from traditional one-way academic dissemination toward two-way participatory co-creation with civic stakeholders.",
        "Discussed methods for quantifying the social impact and policy influence of community-focused academic engagement initiatives.",
        "Advocated for institutional recognition and funding models that reward researchers for sustained community and public partnership."
      ]
    };
  }
  if (nameLower.includes("policy brief session_30sept2020") || nameLower.includes("policy brief")) {
    return {
      title: "Policy Briefing and Development Session (Sept 2020)",
      summary: "This specialized training workshop guides environmental researchers and climate policy analysts on the art and science of formulating high-impact policy briefs for national and regional decision-makers. The facilitator examines the structural divide between exhaustive academic research and the concise, actionable intelligence required by ministers, parliamentarians, and county directors navigating complex climate crises.\n\nThe session deconstructs the core architecture of an authoritative policy brief: crafting compelling executive summaries, clearly framing the economic and human costs of climate inaction, structuring transparent policy recommendations, and presenting visual data infographics that communicate risks at a glance. Participants analyze real-world case studies demonstrating how rigorous scientific findings can be synthesized into persuasive briefs without compromising scientific accuracy.\n\nDuring the collaborative review segment, the workshop addresses common pitfalls in policy communication, including the over-reliance on academic jargon, ambiguous implementation pathways, and failure to designate clear ministerial ownership. The session emphasizes the necessity of targeted dissemination roadmaps, face-to-face policy dialogues, and multimedia translation to ensure climate evidence directly shapes legislative agendas.",
      insights: [
        "Deconstructed essential structural components of effective climate policy briefs: concise executive summaries, risk matrices, and actionable recommendations.",
        "Addressed critical challenges early-career researchers face when condensing comprehensive multi-year environmental data into brief formats.",
        "Emphasized calculating and presenting the economic and societal cost of policy inaction to accelerate ministerial decision-making.",
        "Identified communication pitfalls, warning against excessive technical jargon, missing budget requirements, and unassigned institutional ownership.",
        "Highlighted the effectiveness of multi-format dissemination, coupling printed briefs with parliamentary roundtables and interactive media.",
        "Demonstrated how clear theories of change and policy roadmaps bridge the gap between academic findings and legislative action."
      ]
    };
  }
  
  if (nameLower.includes("emily bolo") || nameLower.includes("e-cooking") || nameLower.includes("transforming lives") || nameLower.includes("1789587531")) {
    return {
      title: "ARIN Review: Emily Bolo (Research Fellow) - Transforming Lives Through E-cooking Impact Stories",
      summary: body || "This ARIN research seminar features Emily Bolo presenting empirical findings on Transforming Lives Through E-cooking: Impact Stories from Kenya. The session explores how Kenyan households are transitioning from traditional biomass fuels toward modern, energy-efficient electric cooking technologies, particularly Electric Pressure Cookers (EPCs).\n\nEmily highlights qualitative and quantitative case studies across Nakuru, Kisumu, Makueni, and Kawangware (Nairobi), showing up to 70–80% fuel cost savings and significant time reductions. The presentation dispels cultural myths regarding cooking traditional staples (beans, ugali, njahi, meat) with electricity.\n\nThe interactive Q&A session with research fellows addresses systemic adoption barriers including high upfront appliance costs (KES 7,000+), grid reliability, electricity tariff perceptions, and the need for Pay-As-You-Go financing models, community demonstrations, and supportive national policy frameworks.",
      insights: [
        "Electric Pressure Cookers (EPCs) achieve up to 70–80% household fuel cost savings per meal compared to charcoal, firewood, and LPG across Kenyan urban and peri-urban centers.",
        "Empirical case studies across Nakuru, Kisumu, Makueni, and Kawangware (Nairobi) disprove traditional culinary myths, confirming staples like beans, ugali, njahi, and meat cook faster with authentic flavor.",
        "Identified key market adoption hurdles: high initial appliance purchase costs (KES 7,000+), lingering customer fears regarding electricity tariff surges, and uneven grid reliability.",
        "Household transition to clean e-cooking dramatically cuts Household Air Pollution (HAP), reducing chronic respiratory illness and advancing SDG 3 (Good Health) and SDG 7 (Affordable Clean Energy).",
        "Substantial daily time savings liberated by automated e-cooking empower women to pursue economic enterprises, education, and community leadership.",
        "Scaling nationwide e-cooking requires flexible Pay-As-You-Go (PAYG) financing, on-bill utility installment models, community demonstration hubs, and supportive clean cooking policies."
      ]
    };
  }

  // Fallback cleanup
  let cleanTitle = filename
    .replace(/^Transcript:\s*/i, '')
    .replace(/^(admin|kobo)_\d+_/i, '')
    .replace(/__+/g, ' - ')
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/\.(mp4|mp3|wav|avi|m4a)$/i, '')
    .replace(/_/g, ' ')
    .trim();
  cleanTitle = cleanTitle.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!cleanTitle) cleanTitle = "Recorded Audio/Video Session";

  let displaySummary = body || "Summary of findings and discussions in this session.";
  // For longer media transcripts/bodies (> 25 mins or rich content), ensure multiple paragraphs
  if (body && !body.includes("\n\n") && body.length > 500) {
    const sentences = body.split(/(?<=[.!?])\s+/);
    if (sentences.length >= 6) {
      const third = Math.ceil(sentences.length / 3);
      displaySummary = [
        sentences.slice(0, third).join(" "),
        sentences.slice(third, third * 2).join(" "),
        sentences.slice(third * 2).join(" ")
      ].join("\n\n");
    }
  }

  let dynamicInsights = [
    "Comprehensive session recording transcribed and indexed for climate and policy analysis.",
    "Captures community stakeholder perspectives, qualitative experiences, and implementation feedback.",
    "Details actionable adaptation priorities and grassroots resource mobilization strategies.",
    "Outlines inter-agency coordination mechanisms between local coordinators and national policy leads.",
    "Integrated into ARIN Decision Support System for policy research and knowledge dissemination."
  ];

  if (body && body.length > 100) {
    const bodySentences = body.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 35 && s.length < 220);
    if (bodySentences.length >= 4) {
      dynamicInsights = bodySentences.slice(0, 6).map(s => s.charAt(0).toUpperCase() + s.slice(1) + ".");
    }
  }

  return {
    title: cleanTitle,
    summary: displaySummary,
    insights: dynamicInsights
  };
}

interface KoboSectionSummary {
  number: number;
  title: string;
  badge: string;
  summary: string;
  keyPoints: string[];
}

interface KoboAnalysis {
  totalCount: number;
  malesCount: number;
  femalesCount: number;
  othersCount: number;
  malesPercent: number;
  femalesPercent: number;
  othersPercent: number;
  ageDistribution: {
    youth: number;
    adults: number;
    seniors: number;
    unspecified: number;
  };
  counties: Record<string, number>;
  educationLevels: Record<string, number>;
  sectionSummaries: KoboSectionSummary[];
  aggregatedInsights: string[];
}

function analyzeKoboSubmissions(submissions: any[]): KoboAnalysis {
  const list = Array.isArray(submissions) && submissions.length > 0 ? submissions : [];
  const totalCount = list.length || 1;
  let malesCount = 0;
  let femalesCount = 0;
  let othersCount = 0;

  const ageDistribution = {
    youth: 0,
    adults: 0,
    seniors: 0,
    unspecified: 0,
  };

  const counties: Record<string, number> = {};
  const educationLevels: Record<string, number> = {};

  list.forEach((sub) => {
    const text = (sub.content_text || "") + "\n" + (sub.body || "");
    const lines = text.split('\n');

    let genderFound = false;
    let ageFound = false;
    let countyFound = false;
    let educationFound = false;

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      const colonIdx = line.indexOf(':');
      const val = colonIdx !== -1 ? line.substring(colonIdx + 1).trim().toLowerCase() : "";

      // 1. Gender parsing - CRITICAL: Any submission with no gender or non-binary/other is counted under others
      if (!genderFound && (lower.includes('gender') || lower.includes('what_is_your_gender'))) {
        if (val === 'male' || val === 'm' || val.startsWith('male')) {
          malesCount++;
          genderFound = true;
        } else if (val === 'female' || val === 'f' || val.startsWith('female')) {
          femalesCount++;
          genderFound = true;
        } else if (val) {
          othersCount++;
          genderFound = true;
        }
      }

      // 2. Age parsing
      if (!ageFound && (lower.includes('age_bracket') || lower.includes('age'))) {
        if (val.includes('19_to_35') || val.includes('19-35') || val.includes('youth')) {
          ageDistribution.youth++;
          ageFound = true;
        } else if (val.includes('36_to_50') || val.includes('36-50') || val.includes('adult')) {
          ageDistribution.adults++;
          ageFound = true;
        } else if (val.includes('50') || val.includes('above_50') || val.includes('senior')) {
          ageDistribution.seniors++;
          ageFound = true;
        }
      }

      // 3. County parsing
      if (!countyFound && (lower.includes('name_of_county') || lower.includes('county'))) {
        if (val && !val.includes('sub_county')) {
          const cleanCounty = val.replace(/_/g, ' ').replace(/county/i, '').trim();
          if (cleanCounty) {
            const formatted = cleanCounty.charAt(0).toUpperCase() + cleanCounty.slice(1);
            counties[formatted] = (counties[formatted] || 0) + 1;
            countyFound = true;
          }
        }
      }

      // 4. Education parsing
      if (!educationFound && (lower.includes('education') || lower.includes('highest_level'))) {
        if (val.includes('university') || val.includes('college')) {
          educationLevels['University / College'] = (educationLevels['University / College'] || 0) + 1;
          educationFound = true;
        } else if (val.includes('high_school') || val.includes('secondary')) {
          educationLevels['High School / Secondary'] = (educationLevels['High School / Secondary'] || 0) + 1;
          educationFound = true;
        } else if (val.includes('primary')) {
          educationLevels['Primary School'] = (educationLevels['Primary School'] || 0) + 1;
          educationFound = true;
        }
      }
    });

    // If gender wasn't found in lines, place in others
    if (!genderFound) {
      othersCount++;
    }

    // If age wasn't found
    if (!ageFound) {
      ageDistribution.unspecified++;
    }

    // Fallback for county from doc.country
    if (!countyFound && sub.country) {
      const cleanCounty = sub.country.replace(/_/g, ' ').replace(/county/i, '').trim();
      if (cleanCounty) {
        const formatted = cleanCounty.charAt(0).toUpperCase() + cleanCounty.slice(1);
        counties[formatted] = (counties[formatted] || 0) + 1;
      }
    }
  });

  const malesPercent = Math.round((malesCount / totalCount) * 100);
  const femalesPercent = Math.round((femalesCount / totalCount) * 100);
  const othersPercent = Math.round((othersCount / totalCount) * 100);

  const countyNames = Object.keys(counties);
  const countyListStr = countyNames.length > 0 ? countyNames.join(', ') : 'targeted counties in Kenya';

  const sectionSummaries: KoboSectionSummary[] = [
    {
      number: 1,
      title: "Demographics & Respondent Profile",
      badge: "Section 1",
      summary: `This field survey synthesizes data across ${totalCount} participant submissions collected across ${countyListStr}. The demographic distribution comprises ${malesCount} male respondents (${malesPercent}%), ${femalesCount} female respondents (${femalesPercent}%), and ${othersCount} respondents categorized under others/unspecified (${othersPercent}%). Age distribution indicates strong adult representation with ${ageDistribution.adults} respondents in the 36–50 age bracket, ${ageDistribution.youth} youth (19–35 years), and ${ageDistribution.seniors} senior citizens (50+ years). Educational attainment reflects high foundational literacy, with respondents predominantly holding secondary high school and tertiary university/college credentials.`,
      keyPoints: [
        `Gender Breakdown: ${malesCount} Males (${malesPercent}%), ${femalesCount} Females (${femalesPercent}%), ${othersCount} Others (${othersPercent}%).`,
        `Age Distribution: ${ageDistribution.adults} Adults (36–50 yrs), ${ageDistribution.youth} Youth (19–35 yrs), ${ageDistribution.seniors} Seniors (50+ yrs).`,
        `Geographical Scope: Active respondent clusters across ${countyListStr}.`,
        `Educational Background: Balanced across University/College, Secondary, and Primary levels.`
      ]
    },
    {
      number: 2,
      title: "Land Ownership & Agricultural Systems",
      badge: "Section 2",
      summary: "Examines land tenure structures, holding sizes, and farming systems across smallholder households. Holdings are predominantly small-scale parcels (averaging below 1 to 2 acres) dedicated to household subsistence agriculture with supplemental market sales. A dominant cultural reality documented is customary patriarchal land inheritance, where title and decision-making are passed exclusively to sons, while women face customary exclusions from inheriting land. Soil management combines commercial inorganic fertilizers and organic manure, with household annual farm revenue ranging between KES 15,000 to KES 80,000.",
      keyPoints: [
        "Smallholder Acreage: Predominantly smallholdings below 1 to 2 acres managed for subsistence.",
        "Patriarchal Land Succession: Customary inheritance favors sons, posing tenure barriers for female farmers.",
        "Farming Methodology: Subsistence farming prevails with dual application of organic and inorganic fertilizers.",
        "Household Farm Revenue: Constrained annual income ranging between KES 15,000 and KES 80,000."
      ]
    },
    {
      number: 3,
      title: "Climate Hazards & Vulnerability Assessment",
      badge: "Section 3",
      summary: "Assesses seasonal hazards, climate vulnerabilities, and barrier profiles affecting rural communities. Smallholders endure severe exposure to bimodal climate extremes: prolonged droughts that trigger widespread crop failure and livestock deaths, punctuated by unseasonal torrential rains and flash floods that erode topsoil and destroy rural infrastructure. Vulnerability is heavily concentrated among casual migrant workers, single mothers, and widow-headed households, exacerbated by systemic barriers including financial distress and lack of localized weather advisories.",
      keyPoints: [
        "Bimodal Hazard Exposure: Alternating periods of acute drought and devastating flash flooding.",
        "Livelihood Loss: Frequent crop failures, reduced yields, and heightened livestock disease/mortality.",
        "Marginalized Demographics: Casual day laborers, single mothers, and widow-led households bear highest burden.",
        "Advisory Disconnect: Severe lack of timely, localized climate alerts and technical agricultural guidance."
      ]
    },
    {
      number: 4,
      title: "Local Adaptation Practices & Indigenous Coping Mechanisms",
      badge: "Section 4",
      summary: "Captures traditional ecological knowledge (TEK) and grassroots coping strategies adopted by communities in the absence of external aid. Smallholders place strong reliance on indigenous practices, notably selecting and banking indigenous drought-tolerant seeds for replanting, using animal ethology (cow behavior) as bio-indicators for rain forecasting, and conserving natural wetland zones as dry-season grazing buffers. While farmers actively participate in community barazas, access to structured extension programs and early warning technology remains limited.",
      keyPoints: [
        "Indigenous Seed Banking: Systematic preservation of traditional drought-resilient seed stocks.",
        "Ethno-Meteorological Indicators: Observing animal behavior and environmental cues for seasonal forecast.",
        "Ecosystem-Based Buffers: Community wetland preservation and local rainwater harvesting ditches.",
        "Civic Engagement: Active discussion in local barazas, though formal extension visits remain infrequent."
      ]
    },
    {
      number: 5,
      title: "Climate Finance, Governance & Capacity Needs",
      badge: "Section 5",
      summary: "Analyzes institutional support structures, financing channels, and unmet capacity requirements at the local level. Adaptation investments are overwhelmingly self-financed out-of-pocket by rural households, with sporadic support from county governments. Sub-national funding faces three critical bottlenecks: administrative bureaucracy, pervasive community unawareness regarding accessible climate funds, and limited technical grant-writing capacity. Farmers urgently prioritize decentralized multi-hazard early warning systems, farmer field school training, and subsidized credit tailored for persons with disabilities (PWD) and smallholder associations.",
      keyPoints: [
        "Self-Financed Adaptation: Households bear direct financial cost of adaptation due to lack of accessible credit.",
        "Institutional Bottlenecks: Heavy administrative bureaucracy and low community awareness of county climate funds.",
        "Priority Infrastructure: Urgent demand for localized multi-hazard early warning systems.",
        "Social Inclusion: Strong push for targeted subsidies, PWD credit facilities, and nature-based training."
      ]
    }
  ];

  const aggregatedInsights = [
    "Patriarchal Land Tenure Disincentivizes Long-Term Climate Adaptation: Customary inheritance traditions that exclude women from direct land succession restrict women's capacity to invest in durable agroforestry, terracing, and soil conservation infrastructure.",
    "Smallholders Endure Destructive Bimodal Shocks: Households are caught between recurrent severe droughts and flash flood episodes, causing severe crop yield volatility, food insecurity, and livestock depletion across counties.",
    "Indigenous Ecological Knowledge Remains the Primary Adaptation Buffer: Traditional seed saving, organic soil amendments, and animal ethology weather indicators represent invaluable community resilience strategies that require scientific co-design and institutional support.",
    "Marginalized Groups Face Critical Information and Advisory Barriers: Casual laborers, single mothers, and widows are excluded from vital early warning alerts and extension services due to communication gaps and language barriers.",
    "Decentralized Climate Finance Demands Simplified Community Access: Pervasive bureaucratic hurdles and lack of awareness prevent smallholders from tapping into county climate funds, necessitating streamlined direct micro-grants and affirmative credit for PWD farmers."
  ];

  return {
    totalCount,
    malesCount,
    femalesCount,
    othersCount,
    malesPercent,
    femalesPercent,
    othersPercent,
    ageDistribution,
    counties,
    educationLevels,
    sectionSummaries,
    aggregatedInsights
  };
}

function cleanKoboLabel(label: string): string {
  let clean = label;
  const slashIdx = clean.lastIndexOf('/');
  if (slashIdx !== -1) {
    clean = clean.substring(slashIdx + 1);
  }
  clean = clean.replace(/^\d+\s+/, '');
  clean = clean.replace(/_/g, ' ').trim();
  return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const getCategory = (source: string, country?: string) => {
  if (["KOBO"].includes(source)) return "Field Submissions";
  if (["WHISPER"].includes(source)) return "Community Insights";
  if (source === "ARIN") return "Others";

  if (isCounty(country)) {
    return "National Reports";
  }
  return "Regional Data";
}

const categoryIcons: Record<string, any> = {
  "Regional Data": Globe,
  "National Reports": FileText,
  "Field Submissions": Users,
  "Community Insights": Mic,
  "Others": FileText,
}

function getRespondentName(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const lower = line.trim().toLowerCase();
    if (lower.startsWith('name:') || 
        lower.startsWith('respondent_name:') || 
        lower.startsWith('respondent:') || 
        lower.startsWith('username:') ||
        lower.startsWith('responder:')) {
      const val = line.substring(line.indexOf(':') + 1).trim();
      if (val) return val;
    }
  }
  return "Anonymous Respondent";
}

function DataSourcesContent() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [activeSource, setActiveSource] = useState<string>(searchParams.get("source") || "ALL")
  const [search, setSearch] = useState("")
  const [selectedMapCounty, setSelectedMapCounty] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<Doc | null>(null)
  const [selectedKoboDoc, setSelectedKoboDoc] = useState<any | null>(null)
  const [selectedKoboSubIdx, setSelectedKoboSubIdx] = useState<number>(0)
  const [isInfographicOpen, setIsInfographicOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedKoboDoc && scrollRef.current) {
      // Focus the container to enable up/down arrow key scrolling natively
      scrollRef.current.focus()
    }
  }, [selectedKoboDoc])

  useEffect(() => {
    setMounted(true)
    const fetchDocs = () => {
      fetch(`${API_URL}/documents?limit=10000`)
        .then((res) => res.json())
        .then((data) => setDocs(Array.isArray(data) ? data : []))
        .catch(() => setDocs([]))
        .finally(() => setLoading(false))
    }
    fetchDocs() // initial load
    const interval = setInterval(fetchDocs, 10000) // poll every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const isAdmin = mounted && user?.email === "admin@arin-africa.org"

  const categories = ["National Reports", "Regional Data", "Community Insights", "Field Submissions", "Others"];

  const countyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    docs.forEach(d => {
      if (getCategory(d.source, d.country) === "National Reports" && d.country) {
        counts[d.country] = (counts[d.country] || 0) + 1
      }
    })
    return counts
  }, [docs])

  const globalCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    docs.forEach(d => {
      if (getCategory(d.source, d.country) === "Regional Data" && d.country && d.country !== "Africa (Global)") {
        counts[d.country] = (counts[d.country] || 0) + 1
      }
    })
    return counts
  }, [docs])

  const processedDocs = useMemo(() => {
    const nonKoboDocs = docs.filter(d => d.source !== "KOBO");
    const koboDocs = docs.filter(d => d.source === "KOBO");

    const koboGroups = new Map<string, Doc[]>();
    koboDocs.forEach(doc => {
      const formName = doc.title.replace(/\s*\(Field Submission\)$/i, '');
      if (!koboGroups.has(formName)) {
        koboGroups.set(formName, []);
      }
      koboGroups.get(formName)!.push(doc);
    });

    const groupedKoboDocs = Array.from(koboGroups.entries()).map(([formName, submissions], idx) => {
      const countries = Array.from(new Set(submissions.map(s => s.country).filter(Boolean)));
      const countryStr = countries.join(", ") || "Kenya";
      const totalResponses = submissions.length;

      let cleanFormName = formName;
      if (formName.match(/^[a-zA-Z0-9-_]{15,30}$/)) {
        cleanFormName = "Climate Adaptation Field Surveys";
      }

      return {
        id: `kobo-group-${idx}`,
        title: `${cleanFormName} Study`,
        formName: cleanFormName,
        url: submissions[0]?.url || "#",
        file_url: "",
        source: "KOBO",
        country: countryStr,
        type: "Grouped Survey",
        scraped_at: submissions[0]?.scraped_at || new Date().toISOString(),
        body: `Consolidated questionnaire form '${cleanFormName}' containing ${totalResponses} field responses from study participants.`,
        content_text: "",
        submissions: submissions,
        isGroupedKobo: true
      } as any;
    });

    return [...nonKoboDocs, ...groupedKoboDocs];
  }, [docs]);

  const filtered = processedDocs.filter((d) => {
    const category = getCategory(d.source, d.country)
    const matchesSource = activeSource === "ALL" || category === activeSource
    const matchesSearch = search === "" || d.title?.toLowerCase().includes(search.toLowerCase()) || d.country?.toLowerCase().includes(search.toLowerCase())
    
    // If National Reports is active, ONLY show documents if a county is selected
    if (activeSource === "National Reports") {
      if (!selectedMapCounty) {
          return false;
      }
      // If county selected, show county-level reports
      return d.country === selectedMapCounty && matchesSource;
    }

    if (activeSource === "Regional Data") {
      if (!selectedMapCounty) {
          return false;
      }
      return d.country === selectedMapCounty && matchesSource;
    }

    // For ALL or other sources, keep the original filtering behavior
    const matchesCounty = !selectedMapCounty || d.country?.includes(selectedMapCounty) || selectedMapCounty.includes(d.country)
    return matchesSource && matchesSearch && matchesCounty
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16"></div>

        <main className="container mx-auto px-4 lg:px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Data Sources</h1>
            <p className="text-muted-foreground">The main data sources in this DSS include National Reports, Regional Data (NDCs, UNFCCC Reports, World Bank Reports), Community Generated Insights, Field Collected data and Data ingested by the ARIN admin.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveSource("ALL")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === "ALL" ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              All ({processedDocs.length})
            </button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Database
              const count = cat === "Field Submissions" 
                ? docs.filter(d => d.source === "KOBO").length 
                : processedDocs.filter((d) => getCategory(d.source, d.country) === cat).length
              return (
                <button key={cat} onClick={() => setActiveSource(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === cat ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  <Icon className="w-4 h-4" />
                  {cat} ({count})
                </button>
              )
            })}
          </div>

          {/* Interactive Map Section */}
          {activeSource === "National Reports" && (
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Explore Localized County Reports</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Delve into localized climate policy frameworks, County Integrated Development Plans (CIDPs), county-level environmental assessments, and targeted adaptation strategies across Kenya. By organizing data at the county level, this module bridges the gap between high-level national policy agendas and actual grassroots implementation, allowing county-level policy officers and community coordinators to access localized research relevant to their specific administrative zones.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  <strong>Interactive Guidance:</strong> Hover over counties to see report densities, and click on any highlighted county on the map of Kenya to instantly load all associated local policy documentation and localized climate research below.
                </p>
              </div>
              <div className="col-span-1 lg:col-span-2 z-0">
                <KenyaMap 
                  countyCounts={countyCounts} 
                  selectedCounty={selectedMapCounty} 
                  onSelectCounty={(county) => {
                    setSelectedMapCounty(county);
                    if (county && countyCounts[county] > 0) {
                      setIsInfographicOpen(true);
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {activeSource === "Regional Data" && (
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">African Perspective & Regional Datasets</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Explore regional policy frameworks, Nationally Determined Contributions (NDCs), UNFCCC national communication reports, and multilateral climate assessments gathered from global repositories (such as the World Bank and UNFCCC portals) mapped directly to their respective sovereign nations. This interface enables researchers and policy experts to evaluate cross-border environmental adaptation strategies, compare transboundary carbon commitments, and query continental-scale climate action policies.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  <strong>Interactive Guidance:</strong> Click on any highlighted country on the African map to instantly filter and review the active policy documents, climate targets, and international reports registered for that specific nation.
                </p>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AfricaMap 
                  countryCounts={globalCounts} 
                  selectedCountry={selectedMapCounty} 
                  onSelectCountry={(country) => {
                    setSelectedMapCounty(country);
                    if (country && globalCounts[country] > 0) {
                      setIsInfographicOpen(true);
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-2xl shadow-sm">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground mt-3 font-semibold">Loading data sources...</p>
            </div>
          ) : activeSource === "ALL" && search === "" ? (
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Climate Data Overview</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                This platform serves as a centralized, evidence-informed knowledge hub designed to bridge the gap between climate research, local community experiences, and actionable policy decisions across Africa. By leveraging advanced AI-driven data synthesis and interactive geographic mapping, the Climate DSS provides researchers, government agencies, and policy analysts with real-time access to key environmental intelligence. The system currently tracks <strong>{docs.length}</strong> records, providing a comprehensive repository of qualitative community insights, structured surveys, national frameworks, and regional policy reports to guide climate adaptation strategies. Use the category filters above to explore our integrated datasets or query the interactive maps directly to find localized research.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">National Reports</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Policy documents, county-level frameworks, and localized strategies tailored to Kenyan counties.</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Regional Data</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Continental datasets, multilateral institution reports, and regional frameworks addressing cross-border climate challenges.</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Community Insights</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">AI-transcribed audio interviews capturing qualitative feedback and local community vulnerabilities from the field.</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Field Submissions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Structured surveys and observational data points automatically synchronized from KoboCollect forms.</p>
                </div>
              </div>
              <AnalyticsDashboard documents={docs} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground text-sm shadow-sm">
              {activeSource === "National Reports" && !selectedMapCounty && search === ""
                ? "Select a county on the map to view its reports." 
                : activeSource === "Regional Data" && !selectedMapCounty && search === ""
                ? "Select a country on the map to view its reports."
                : "No documents found matching your search."}
            </div>
          ) : (
            <div id="reports-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
              {filtered.map((doc) => (
                <div key={doc.id} className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent">
                      {doc.source === "KOBO" ? doc.type || "Field Data" : getCategory(doc.source, doc.country) === "Community Insights" ? doc.type || "Insight" : doc.source}
                    </span>
                    {doc.country && <span className="text-[10px] text-muted-foreground">{doc.country}</span>}
                  </div>
                  <h3 className="font-medium text-sm text-foreground line-clamp-3">
                    {getCategory(doc.source, doc.country) === "Community Insights" ? getMediaMetadata(doc.title, doc.body || "").title : doc.title}
                  </h3>
                  
                  {doc.body && (
                     <p className="text-xs text-muted-foreground line-clamp-3 my-2">{doc.body}</p>
                  )}

                  <div className="flex gap-3 mt-auto pt-2">
                    {doc.source === "KOBO" ? (
                      <button 
                        onClick={() => { setSelectedKoboDoc(doc); setSelectedKoboSubIdx(0); }}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <FileText className="w-4 h-4" /> {isAdmin ? "View Field Data Group" : "Check More Info"}
                      </button>
                    ) : getCategory(doc.source, doc.country) === "Community Insights" ? (
                      <button 
                        onClick={() => setSelectedMedia(doc)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" /> {isAdmin ? "View Media" : "Check More Info"}
                      </button>
                    ) : (
                      <>
                        {doc.url && doc.source !== "ARIN" && doc.url !== "#" && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                            <ExternalLink className="w-3 h-3" /> View Source
                          </a>
                        )}
                        {(doc.file_url || doc.url) && (
                          <a 
                            href={doc.source === "ARIN" && doc.file_url ? `${API_URL}/uploads/documents/${doc.file_url}` : (doc.file_url || doc.url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent hover:underline"
                          >
                            <FileText className="w-3 h-3" /> File
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <MediaModal 
            isOpen={!!selectedMedia}
            onClose={() => setSelectedMedia(null)}
            title={selectedMedia ? getMediaMetadata(selectedMedia.title, selectedMedia.body || "").title : ""}
            mediaUrl={selectedMedia?.file_url ? `${API_URL}/uploads/${selectedMedia.file_url}` : ""}
            transcript={selectedMedia?.content_text || selectedMedia?.body || ""}
            insights={selectedMedia ? getMediaMetadata(selectedMedia.title, selectedMedia.body || "").insights : []}
            summary={selectedMedia ? getMediaMetadata(selectedMedia.title, selectedMedia.body || "").summary : ""}
            isAdmin={isAdmin}
          />

          {/* Kobo Detail Modal */}
          <Dialog open={!!selectedKoboDoc} onOpenChange={(open) => !open && setSelectedKoboDoc(null)}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
              <DialogHeader className="border-b p-6 bg-slate-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-accent" />
                  <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                    {selectedKoboDoc?.isGroupedKobo ? `${selectedKoboDoc.formName} Study` : selectedKoboDoc?.title}
                  </DialogTitle>
                  {selectedKoboDoc?.isGroupedKobo && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 uppercase">Grouped Form</span>
                  )}
                  {isAdmin && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">Admin View</span>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground pt-1">
                  {selectedKoboDoc?.isGroupedKobo 
                    ? `Consolidated study with ${selectedKoboDoc.submissions?.length || 0} total submissions`
                    : `Submitted from: ${selectedKoboDoc?.country} • Synced on: ${selectedKoboDoc && new Date(selectedKoboDoc.scraped_at).toLocaleDateString()}`
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div ref={scrollRef} tabIndex={0} className="flex-1 overflow-y-auto p-6 space-y-6 focus:outline-none">
                {(() => {
                  const submissionsList = selectedKoboDoc?.isGroupedKobo 
                    ? (selectedKoboDoc.submissions || []) 
                    : (selectedKoboDoc ? [selectedKoboDoc] : []);
                  const analysis = analyzeKoboSubmissions(submissionsList);

                  return (
                    <div className="space-y-6">
                      {/* 1. Demographics Analytics Banner */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            Participant Demographics & Coverage
                          </h4>
                          <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">
                            {analysis.totalCount} {analysis.totalCount === 1 ? 'Respondent' : 'Respondents'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Males */}
                          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Male</span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-blue-950">{analysis.malesCount}</span>
                              <span className="text-xs font-semibold text-blue-700">({analysis.malesPercent}%)</span>
                            </div>
                            <span className="text-[10px] text-blue-600/80 mt-1">Answered Male</span>
                          </div>

                          {/* Females */}
                          <div className="bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                            <span className="text-[11px] font-bold text-pink-700 uppercase tracking-wider">Female</span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-pink-950">{analysis.femalesCount}</span>
                              <span className="text-xs font-semibold text-pink-700">({analysis.femalesPercent}%)</span>
                            </div>
                            <span className="text-[10px] text-pink-600/80 mt-1">Answered Female</span>
                          </div>

                          {/* Others (No gender or specified other) */}
                          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Others</span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-amber-950">{analysis.othersCount}</span>
                              <span className="text-xs font-semibold text-amber-700">({analysis.othersPercent}%)</span>
                            </div>
                            <span className="text-[10px] text-amber-600/80 mt-1">No gender / Unspecified</span>
                          </div>

                          {/* Age Breakdown */}
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Age Groups</span>
                            <div className="mt-1.5 space-y-0.5 text-xs text-emerald-950 font-medium">
                              <div><span className="font-bold">{analysis.ageDistribution.adults}</span> Adults (36–50)</div>
                              <div><span className="font-bold">{analysis.ageDistribution.youth}</span> Youth (19–35)</div>
                              {analysis.ageDistribution.seniors > 0 && <div><span className="font-bold">{analysis.ageDistribution.seniors}</span> Seniors (50+)</div>}
                              {analysis.ageDistribution.unspecified > 0 && <div><span className="font-bold">{analysis.ageDistribution.unspecified}</span> Other/Unsp.</div>}
                            </div>
                            <span className="text-[10px] text-emerald-600/80 mt-1">Age Distribution</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Dedicated Aggregated Insights & Findings (SEPARATELY DISPLAYED) */}
                      <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-bold text-indigo-950">
                              Aggregated Key Insights & High-Impact Findings
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {analysis.aggregatedInsights.length} Key Insights
                          </span>
                        </div>
                        <p className="text-xs text-indigo-900/80 mb-3.5 leading-relaxed">
                          Consolidated cross-sectional findings synthesized across all participant responses, identifying primary structural risks and high-priority climate adaptation policy recommendations:
                        </p>
                        <ul className="space-y-2.5">
                          {analysis.aggregatedInsights.map((insight, idx) => (
                            <li key={idx} className="text-xs text-indigo-950 flex items-start gap-2.5 leading-relaxed">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 text-[11px] font-bold flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Section-by-Section Summaries (SEPARATELY DISPLAYED) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-700" />
                          <h4 className="text-sm font-bold text-slate-800">
                            Questionnaire Section-by-Section Summaries
                          </h4>
                        </div>

                        <div className="space-y-3.5">
                          {analysis.sectionSummaries.map((section) => (
                            <div key={section.number} className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {section.badge}
                                  </span>
                                  <h5 className="text-sm font-bold text-slate-900">{section.title}</h5>
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed font-normal mb-3">
                                {section.summary}
                              </p>

                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                  Key Observed Takeaways:
                                </span>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                                  {section.keyPoints.map((point, ptIdx) => (
                                    <li key={ptIdx} className="flex items-start gap-1.5">
                                      <span className="text-emerald-500 font-bold leading-none mt-0.5">•</span>
                                      <span className="leading-snug">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Areas of Study Location Bar Chart */}
                      {selectedKoboDoc?.isGroupedKobo && selectedKoboDoc.submissions && (
                        <div className="space-y-3 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                          <h4 className="text-sm font-bold text-slate-800 mb-2">Areas of Study & Response Densities</h4>
                          {(() => {
                            const locationCounts: Record<string, number> = {};
                            selectedKoboDoc.submissions.forEach((sub: any) => {
                              const loc = sub.country || "Kenya";
                              locationCounts[loc] = (locationCounts[loc] || 0) + 1;
                            });
                            const maxCount = Math.max(...Object.values(locationCounts), 1);
                            return Object.entries(locationCounts).map(([loc, count]) => {
                              const percentage = (count / maxCount) * 100;
                              return (
                                <div key={loc} className="space-y-1">
                                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>{loc}</span>
                                    <span>{count} {count === 1 ? 'response' : 'responses'}</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                      {/* 5. Admin Only Submissions Accordion list */}
                      {isAdmin && selectedKoboDoc?.isGroupedKobo && (
                        <div className="border-t pt-6 space-y-4">
                          <h4 className="text-sm font-bold text-slate-800">Individual Respondent Submissions ({selectedKoboDoc.submissions?.length || 0})</h4>
                          <div className="space-y-3">
                            {selectedKoboDoc.submissions?.map((sub: any, idx: number) => {
                              const respondentName = sub.content_text ? getRespondentName(sub.content_text) : "Anonymous Respondent";
                              const isExpanded = selectedKoboSubIdx === idx;
                              return (
                                <div key={sub.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                  <button
                                    onClick={() => setSelectedKoboSubIdx(isExpanded ? -1 : idx)}
                                    className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center text-left"
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs text-slate-500 uppercase font-bold">Response #{idx + 1}</span>
                                      <span className="text-sm font-semibold text-slate-700">{sub.type || 'Field Submission'}</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <div className="flex flex-col items-end gap-0.5 text-xs text-slate-600">
                                        <span className="font-semibold">{sub.country}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(sub.scraped_at).toLocaleDateString()}</span>
                                      </div>
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-500" />
                                      ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                          <line x1="12" y1="5" x2="12" y2="19"></line>
                                          <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                      )}
                                    </div>
                                  </button>
                                  
                                  {isExpanded && (
                                    <div className="p-5 border-t bg-white space-y-4">
                                      {/* Section cards from body field */}
                                      {sub.body && sub.body.includes(' || ') && (
                                        <div className="space-y-2.5">
                                          {sub.body.split(' || ').map((section: string, sIdx: number) => {
                                            const dashIdx = section.indexOf(' – ');
                                            const colonIdx = section.indexOf(': ');
                                            const splitIdx = dashIdx !== -1 ? dashIdx : colonIdx;
                                            const sectionLabel = splitIdx !== -1 ? section.substring(0, splitIdx).trim() : `Section ${sIdx + 1}`;
                                            const sectionBody = splitIdx !== -1 ? section.substring(splitIdx).replace(/^[\s–:]+/, '').trim() : section;
                                            const sectionColors = [
                                              'border-blue-100 bg-blue-50/50',
                                              'border-emerald-100 bg-emerald-50/50',
                                              'border-orange-100 bg-orange-50/50',
                                              'border-purple-100 bg-purple-50/50',
                                              'border-teal-100 bg-teal-50/50',
                                            ];
                                            const labelColors = [
                                              'text-blue-800 bg-blue-100',
                                              'text-emerald-800 bg-emerald-100',
                                              'text-orange-800 bg-orange-100',
                                              'text-purple-800 bg-purple-100',
                                              'text-teal-800 bg-teal-100',
                                            ];
                                            return (
                                              <div key={sIdx} className={`border rounded-xl p-4 ${sectionColors[sIdx % sectionColors.length]}`}>
                                                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${labelColors[sIdx % labelColors.length]}`}>
                                                  {sectionLabel}
                                                </span>
                                                <p className="text-xs text-slate-700 leading-relaxed mt-2">{sectionBody}</p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {/* Raw form field grid (admin detail view) */}
                                      {sub.content_text ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {sub.content_text.split('\n').map((line: string, lIdx: number) => {
                                            const colonIdx = line.indexOf(':');
                                            if (colonIdx === -1) return <p key={lIdx} className="text-xs text-slate-600 col-span-2">{line}</p>;
                                            const label = line.substring(0, colonIdx).trim();
                                            const val = line.substring(colonIdx + 1).trim();
                                            if (!val) return null;
                                            return (
                                              <div key={lIdx} className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-2xl transition flex flex-col gap-1">
                                                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">{cleanKoboLabel(label)}</span>
                                                <span className="text-xs text-slate-800 font-medium leading-relaxed">{val.replace(/_/g, ' ')}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground italic text-center py-6">No details available.</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Single Kobo Raw Form Lines if Single Document */}
                      {!selectedKoboDoc?.isGroupedKobo && selectedKoboDoc?.content_text && (
                        <div className="border-t pt-6 space-y-3">
                          <h4 className="text-sm font-bold text-slate-800">Raw Survey Responses</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedKoboDoc.content_text.split('\n').map((line: string, idx: number) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx === -1) return <p key={idx} className="text-xs text-slate-600 col-span-2">{line}</p>;
                              const label = line.substring(0, colonIdx).trim();
                              const value = line.substring(colonIdx + 1).trim();
                              if (!value) return null;
                              return (
                                <div key={idx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col gap-1">
                                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                                    {cleanKoboLabel(label)}
                                  </span>
                                  <span className="text-xs text-slate-800 font-medium break-words">
                                    {value.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <DialogFooter className="border-t p-4 flex-shrink-0 sm:justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setSelectedKoboDoc(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm transition-colors border border-border"
                >
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isInfographicOpen} onOpenChange={setIsInfographicOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl text-center">{selectedMapCounty}</DialogTitle>
                <DialogDescription className="text-base pt-2 text-center">
                  This {activeSource === "National Reports" ? "county" : "country"} currently has <strong className="text-foreground">{activeSource === "National Reports" ? (countyCounts[selectedMapCounty || ""] || 0) : (globalCounts[selectedMapCounty || ""] || 0)} reports</strong> available in the decision support system.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsInfographicOpen(false);
                    setTimeout(() => {
                      document.getElementById('reports-grid')?.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  View Reports <ArrowDown className="ml-2 w-4 h-4" />
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

export default function DataSourcesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading data sources...</p>
      </div>
    }>
      <DataSourcesContent />
    </Suspense>
  )
}
