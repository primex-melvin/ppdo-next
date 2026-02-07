export type InspectionStatus = "pending" | "verified"

export type ProjectType = "road" | "bridge" | "building" | "water" | "power"
export type ProjectStatus = "planning" | "ongoing" | "completed" | "suspended"

export type VisibilityType = "public" | "private" | "allowed-accounts"

export type Activity = {
  id: string
  inspectionId: string // Reference to parent inspection
  images: string[]
  postedBy: {
    name: string
    role: string
    avatar: string
  }
  date: string
  status: InspectionStatus
  description: string
  remarks?: Remark[]
  visibility: VisibilityType // public, private, or allowed-accounts
  createdAt: string
  updatedAt: string
  editedBy?: {
    // Track who last edited
    name: string
    date: string
  }
}

export type Remark = {
  id: string
  author: {
    name: string
    role: string
    avatar: string
  }
  content: string
  timestamp: string
  replies?: Remark[]
}

export type Inspection = {
  id: string
  title: string
  projectNumber: string
  location: string
  coverImage: string
  status: InspectionStatus
  inspector: {
    name: string
    role: string
    avatar: string
  }
  dateRecorded: string
  activities: Activity[]
  remarks: Remark[]
}

export type Project = {
  id: string
  name: string
  projectNumber: string
  municipality: string
  type: ProjectType
  status: ProjectStatus
  coverImage: string
  budget: string
  contractor: string
  startDate: string
  expectedCompletion: string
  description: string
  inspectionCount: number
}

export const CEBU_PROJECTS: Project[] = [
  {
    id: "proj-001",
    name: "Cebu Bus Rapid Transit (BRT) System",
    projectNumber: "CEB-2024-001",
    municipality: "Cebu City",
    type: "road",
    status: "ongoing",
    coverImage: "/projects/brt-thumbnail.jpg",
    budget: "₱1.5 Billion",
    contractor: "Cebu Metropolitan Transportation Authority",
    startDate: "2024-01-01",
    expectedCompletion: "2025-12-31",
    description: "Expansion and modernization of the BRT system to enhance public transportation in Cebu.",
    inspectionCount: 10,
  },
  {
    id: "proj-002",
    name: "Mactan-Cebu International Airport Expansion",
    projectNumber: "CEB-2024-002",
    municipality: "Lapu-Lapu City",
    type: "bridge",
    status: "ongoing",
    coverImage: "/projects/airport-thumbnail.jpg",
    budget: "₱1.8 Billion",
    contractor: "Cebu International Airport Corporation",
    startDate: "2024-03-01",
    expectedCompletion: "2026-06-30",
    description: "Expansion of the airport to accommodate more passengers and improve facilities.",
    inspectionCount: 14,
  },
  {
    id: "proj-003",
    name: "Cebu-Cordova Link Expressway (CCLEX) Extension",
    projectNumber: "CEB-2024-003",
    municipality: "Cordova",
    type: "road",
    status: "ongoing",
    coverImage: "/projects/cclex-thumbnail.jpg",
    budget: "₱2.5 Billion",
    contractor: "Metro Pacific Tollways Corporation",
    startDate: "2025-06-01",
    expectedCompletion: "2027-12-31",
    description:
      "Extension of the existing Cebu-Cordova Link Expressway to improve traffic flow and connectivity in Metro Cebu.",
    inspectionCount: 12,
  },
  {
    id: "proj-004",
    name: "Metro Cebu Flood Control Project",
    projectNumber: "CEB-2024-004",
    municipality: "Mandaue City",
    type: "water",
    status: "ongoing",
    coverImage: "/projects/flood-control.jpg",
    budget: "₱500 Million",
    contractor: "Cebu Flood Control Corporation",
    startDate: "2024-07-01",
    expectedCompletion: "2028-12-31",
    description:
      "Construction of comprehensive flood control infrastructure including drainage canals and pumping stations.",
    inspectionCount: 8,
  },
  {
    id: "proj-005",
    name: "Cebu Provincial Hospital Upgrade",
    projectNumber: "CEB-2024-005",
    municipality: "Bogo City",
    type: "building",
    status: "completed",
    coverImage: "/projects/hospital-thumbnail.jpg",
    budget: "₱1.2 Billion",
    contractor: "Megawide Construction Corporation",
    startDate: "2023-09-01",
    expectedCompletion: "2024-12-31",
    description: "Expansion of city hospital with additional 200 beds, modern ICU, and diagnostic facilities.",
    inspectionCount: 20,
  },
]

export const TARLAC_PROJECTS: Project[] = [
  {
    id: "proj-001",
    name: "Tarlac City Diversion Road Phase 2",
    projectNumber: "TAR-2024-001",
    municipality: "Tarlac City",
    type: "road",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-highway-construction-aerial-view.jpg",
    budget: "₱850 Million",
    contractor: "Tarlac Engineering & Construction",
    startDate: "2024-01-01",
    expectedCompletion: "2025-12-31",
    description: "Expansion of the diversion road to alleviate traffic congestion in the city center.",
    inspectionCount: 15,
  },
  {
    id: "proj-002",
    name: "Capas-Bamban Bypass Bridge",
    projectNumber: "TAR-2024-002",
    municipality: "Capas",
    type: "bridge",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-bridge-construction-over-water.jpg",
    budget: "₱1.2 Billion",
    contractor: "Luzon Infrastructure Builders",
    startDate: "2024-03-01",
    expectedCompletion: "2026-06-30",
    description: "Construction of a new bypass bridge connecting Capas and Bamban municipalities.",
    inspectionCount: 22,
  },
  {
    id: "proj-003",
    name: "Concepcion Multi-Purpose Sports Arena",
    projectNumber: "TAR-2024-003",
    municipality: "Concepcion",
    type: "building",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-modern-sports-complex-construction.jpg",
    budget: "₱450 Million",
    contractor: "Concepcion DevCorp",
    startDate: "2024-05-01",
    expectedCompletion: "2026-12-31",
    description: "A state-of-the-art sports arena for community events and regional competitions.",
    inspectionCount: 18,
  },
  {
    id: "proj-004",
    name: "Victoria Irrigation Canal Rehabilitation",
    projectNumber: "TAR-2024-004",
    municipality: "Victoria",
    type: "water",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-water-treatment-facility-construction.jpg",
    budget: "₱320 Million",
    contractor: "Agri-Tech Solutions Inc.",
    startDate: "2024-07-01",
    expectedCompletion: "2025-08-31",
    description: "Modernizing the irrigation system to support local farmers during dry seasons.",
    inspectionCount: 12,
  },
  {
    id: "proj-005",
    name: "Paniqui Solar Farm Access Road",
    projectNumber: "TAR-2024-005",
    municipality: "Paniqui",
    type: "road",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-coastal-road-construction-beach.jpg",
    budget: "₱150 Million",
    contractor: "GreenPath Construction",
    startDate: "2024-09-01",
    expectedCompletion: "2025-03-31",
    description: "Improving access to the newly established solar farm in Paniqui.",
    inspectionCount: 9,
  },
  {
    id: "proj-006",
    name: "Camiling Public Market Expansion",
    projectNumber: "TAR-2024-006",
    municipality: "Camiling",
    type: "building",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-modern-public-market-interior.jpg",
    budget: "₱280 Million",
    contractor: "Heritage Builders Camiling",
    startDate: "2024-11-01",
    expectedCompletion: "2025-10-31",
    description: "Expanding the public market to accommodate more vendors and improve facilities.",
    inspectionCount: 14,
  },
  {
    id: "proj-007",
    name: "Gerona Rural Electrification Expansion",
    projectNumber: "TAR-2024-007",
    municipality: "Gerona",
    type: "power",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-solar-panel-installation-field.jpg",
    budget: "₱180 Million",
    contractor: "Tarlac Electric Cooperative",
    startDate: "2024-12-01",
    expectedCompletion: "2025-12-31",
    description: "Expanding the power grid to reach remote barangays in Gerona.",
    inspectionCount: 7,
  },
  {
    id: "proj-008",
    name: "Moncada Drainage & Flood Control",
    projectNumber: "TAR-2024-008",
    municipality: "Moncada",
    type: "water",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-flood-control-drainage-construction.jpg",
    budget: "₱550 Million",
    contractor: "FlowGuard Infrastructure",
    startDate: "2025-01-15",
    expectedCompletion: "2026-06-30",
    description: "Enhancing the drainage system to prevent flooding in low-lying areas of Moncada.",
    inspectionCount: 11,
  },
  {
    id: "proj-009",
    name: "Bamban Highway Overpass",
    projectNumber: "TAR-2024-009",
    municipality: "Bamban",
    type: "bridge",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-highway-overpass-construction.jpg",
    budget: "₱720 Million",
    contractor: "Skyline Engineering",
    startDate: "2025-03-01",
    expectedCompletion: "2027-03-01",
    description: "A multi-level overpass to ease traffic at the intersection of McArthur Highway.",
    inspectionCount: 10,
  },
  {
    id: "proj-010",
    name: "Pura Community Wellness Center",
    projectNumber: "TAR-2024-010",
    municipality: "Pura",
    type: "building",
    status: "ongoing",
    coverImage: "/images/attachments-gen-images-public-professional-woman-avatar.png",
    budget: "₱90 Million",
    contractor: "Pura Local Builders",
    startDate: "2025-04-01",
    expectedCompletion: "2026-04-01",
    description: "Construction of a wellness center for community health and recreational activities.",
    inspectionCount: 5,
  },
]

export const MOCK_PROJECTS: Project[] = [...CEBU_PROJECTS, ...TARLAC_PROJECTS]

export const MOCK_INSPECTOR_DATA: Record<string, Inspection> = {
  "snap-001": {
    id: "snap-001",
    title: "Infrastructure Development - Phase 1",
    projectNumber: "PROJ-2026-001",
    location: "Tarlac City, Tarlac",
    coverImage: "/construction-site-aerial.png",
    status: "verified",
    inspector: {
      name: "Maria Santos",
      role: "Senior Civil Engineer",
      avatar: "/professional-woman-avatar.png",
    },
    dateRecorded: "2026-01-01T02:01:14Z",
    activities: [
      {
        id: "act-001",
        inspectionId: "snap-001",
        images: [
          "/foundation-construction.jpg",
          "/steel-reinforcement-bars.jpg",
          "/construction-workers-pouring-concrete.jpg",
        ],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-01T02:01:14Z",
        status: "verified",
        description:
          "Foundation works completed according to specifications. Concrete pour test results within acceptable range. Steel reinforcement placement verified and approved.",
        remarks: [
          {
            id: "rem-001",
            author: {
              name: "Roberto Cruz",
              role: "Project Manager",
              avatar: "/manager-avatar.png",
            },
            content: "Excellent progress on the foundation work. Quality standards are being maintained.",
            timestamp: "2026-01-01T10:00:00Z",
            replies: [
              {
                id: "rem-002",
                author: {
                  name: "Maria Santos",
                  role: "Senior Civil Engineer",
                  avatar: "/professional-woman-avatar.png",
                },
                content: "Thank you. The team has been very diligent with the specifications.",
                timestamp: "2026-01-01T10:15:00Z",
              },
            ],
          },
          {
            id: "rem-003",
            author: {
              name: "Ana Reyes",
              role: "Safety Officer",
              avatar: "/safety-officer-avatar.jpg",
            },
            content:
              "Please ensure all workers are wearing proper PPE in the next set of photos. This is mandatory for documentation.",
            timestamp: "2026-01-01T11:30:00Z",
          },
        ],
        visibility: "public",
        createdAt: "2026-01-01T02:01:14Z",
        updatedAt: "2026-01-01T02:01:14Z",
      },
      {
        id: "act-002",
        inspectionId: "snap-001",
        images: ["/building-framework-steel-beams.jpg"],
        postedBy: {
          name: "Juan Dela Cruz",
          role: "Structural Inspector",
          avatar: "/professional-man-avatar.png",
        },
        date: "2026-01-01T08:30:00Z",
        status: "pending",
        description:
          "Structural framework installation in progress. Awaiting final measurements and alignment verification before proceeding to next phase.",
        remarks: [
          {
            id: "rem-004",
            author: {
              name: "Carlos Mendoza",
              role: "Bridge Engineer",
              avatar: "/engineer-avatar.png",
            },
            content: "The steel beam alignment looks good. Recommend double-checking the bolted connections.",
            timestamp: "2026-01-01T09:00:00Z",
          },
        ],
        visibility: "public",
        createdAt: "2026-01-01T08:30:00Z",
        updatedAt: "2026-01-01T08:30:00Z",
      },
      {
        id: "act-003",
        inspectionId: "snap-001",
        images: ["/foundation-construction.jpg"],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-02T09:15:00Z",
        status: "verified",
        description: "Concrete curing test completed. All samples passed compressive strength requirements.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-02T09:15:00Z",
        updatedAt: "2026-01-02T09:15:00Z",
      },
      {
        id: "act-004",
        inspectionId: "snap-001",
        images: ["/steel-reinforcement-bars.jpg", "/building-framework-steel-beams.jpg"],
        postedBy: {
          name: "Juan Dela Cruz",
          role: "Structural Inspector",
          avatar: "/professional-man-avatar.png",
        },
        date: "2026-01-02T14:30:00Z",
        status: "pending",
        description: "Steel reinforcement placement verification in progress. Quality marks are satisfactory.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-02T14:30:00Z",
        updatedAt: "2026-01-02T14:30:00Z",
      },
      {
        id: "act-005",
        inspectionId: "snap-001",
        images: [],
        postedBy: {
          name: "Ana Reyes",
          role: "Safety Officer",
          avatar: "/safety-officer-avatar.jpg",
        },
        date: "2026-01-03T07:45:00Z",
        status: "verified",
        description: "Safety inspection completed. All site personnel have valid safety certifications.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-03T07:45:00Z",
        updatedAt: "2026-01-03T07:45:00Z",
      },
      {
        id: "act-006",
        inspectionId: "snap-001",
        images: ["/construction-workers-pouring-concrete.jpg"],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-03T11:20:00Z",
        status: "verified",
        description: "Second concrete pour executed with improved consistency. Slump test results excellent.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-03T11:20:00Z",
        updatedAt: "2026-01-03T11:20:00Z",
      },
      {
        id: "act-007",
        inspectionId: "snap-001",
        images: ["/building-framework-steel-beams.jpg"],
        postedBy: {
          name: "Roberto Cruz",
          role: "Project Manager",
          avatar: "/manager-avatar.png",
        },
        date: "2026-01-04T10:00:00Z",
        status: "pending",
        description: "Progress meeting held. On track with Phase 1 completion. Minor scheduling adjustments required.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-04T10:00:00Z",
        updatedAt: "2026-01-04T10:00:00Z",
      },
      {
        id: "act-008",
        inspectionId: "snap-001",
        images: ["/foundation-construction.jpg", "/steel-reinforcement-bars.jpg"],
        postedBy: {
          name: "Juan Dela Cruz",
          role: "Structural Inspector",
          avatar: "/professional-man-avatar.png",
        },
        date: "2026-01-04T15:30:00Z",
        status: "verified",
        description: "Foundation inspection completed. All critical measurements within tolerance limits.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-04T15:30:00Z",
        updatedAt: "2026-01-04T15:30:00Z",
      },
      {
        id: "act-009",
        inspectionId: "snap-001",
        images: ["/construction-workers-pouring-concrete.jpg"],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-05T08:45:00Z",
        status: "verified",
        description: "Pile driving operations started. All equipment calibrated and tested for accuracy.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-05T08:45:00Z",
        updatedAt: "2026-01-05T08:45:00Z",
      },
      {
        id: "act-010",
        inspectionId: "snap-001",
        images: [],
        postedBy: {
          name: "Ana Reyes",
          role: "Safety Officer",
          avatar: "/safety-officer-avatar.jpg",
        },
        date: "2026-01-05T12:00:00Z",
        status: "verified",
        description: "Weekly safety briefing conducted. Zero incidents reported this week.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-05T12:00:00Z",
        updatedAt: "2026-01-05T12:00:00Z",
      },
      {
        id: "act-011",
        inspectionId: "snap-001",
        images: ["/building-framework-steel-beams.jpg"],
        postedBy: {
          name: "Juan Dela Cruz",
          role: "Structural Inspector",
          avatar: "/professional-man-avatar.png",
        },
        date: "2026-01-06T09:30:00Z",
        status: "pending",
        description: "Initial steel structure erection completed. Awaiting connection torque verification.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-06T09:30:00Z",
        updatedAt: "2026-01-06T09:30:00Z",
      },
      {
        id: "act-012",
        inspectionId: "snap-001",
        images: ["/foundation-construction.jpg"],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-06T14:15:00Z",
        status: "verified",
        description: "Sub-surface investigation completed. No unexpected geological conditions encountered.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-06T14:15:00Z",
        updatedAt: "2026-01-06T14:15:00Z",
      },
      {
        id: "act-013",
        inspectionId: "snap-001",
        images: ["/steel-reinforcement-bars.jpg", "/construction-workers-pouring-concrete.jpg"],
        postedBy: {
          name: "Roberto Cruz",
          role: "Project Manager",
          avatar: "/manager-avatar.png",
        },
        date: "2026-01-07T10:45:00Z",
        status: "pending",
        description: "Material delivery verification complete. Batch testing scheduled for next week.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-07T10:45:00Z",
        updatedAt: "2026-01-07T10:45:00Z",
      },
      {
        id: "act-014",
        inspectionId: "snap-001",
        images: [],
        postedBy: {
          name: "Ana Reyes",
          role: "Safety Officer",
          avatar: "/safety-officer-avatar.jpg",
        },
        date: "2026-01-07T16:00:00Z",
        status: "verified",
        description: "Emergency procedure drills conducted with all site personnel.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-07T16:00:00Z",
        updatedAt: "2026-01-07T16:00:00Z",
      },
      {
        id: "act-015",
        inspectionId: "snap-001",
        images: ["/building-framework-steel-beams.jpg"],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-08T09:00:00Z",
        status: "verified",
        description: "Formwork installation initiated for Phase 2. Layouts reviewed and approved.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-08T09:00:00Z",
        updatedAt: "2026-01-08T09:00:00Z",
      },
      {
        id: "act-016",
        inspectionId: "snap-001",
        images: ["/foundation-construction.jpg", "/steel-reinforcement-bars.jpg"],
        postedBy: {
          name: "Juan Dela Cruz",
          role: "Structural Inspector",
          avatar: "/professional-man-avatar.png",
        },
        date: "2026-01-08T13:20:00Z",
        status: "pending",
        description: "Column reinforcement inspection in progress. Quality standards maintained throughout.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-08T13:20:00Z",
        updatedAt: "2026-01-08T13:20:00Z",
      },
      {
        id: "act-017",
        inspectionId: "snap-001",
        images: ["/construction-workers-pouring-concrete.jpg"],
        postedBy: {
          name: "Maria Santos",
          role: "Senior Civil Engineer",
          avatar: "/professional-woman-avatar.png",
        },
        date: "2026-01-09T08:30:00Z",
        status: "verified",
        description: "Third concrete pour completed successfully. Consolidation procedures executed properly.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-09T08:30:00Z",
        updatedAt: "2026-01-09T08:30:00Z",
      },
      {
        id: "act-018",
        inspectionId: "snap-001",
        images: [],
        postedBy: {
          name: "Roberto Cruz",
          role: "Project Manager",
          avatar: "/manager-avatar.png",
        },
        date: "2026-01-09T15:45:00Z",
        status: "verified",
        description: "Billings and progress documentation submitted. Project 95% complete on schedule.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-09T15:45:00Z",
        updatedAt: "2026-01-09T15:45:00Z",
      },
      {
        id: "act-019",
        inspectionId: "snap-001",
        images: ["/building-framework-steel-beams.jpg"],
        postedBy: {
          name: "Ana Reyes",
          role: "Safety Officer",
          avatar: "/safety-officer-avatar.jpg",
        },
        date: "2026-01-10T11:00:00Z",
        status: "pending",
        description: "Site health and safety audit conducted. Minor corrective actions required on two items.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-10T11:00:00Z",
        updatedAt: "2026-01-10T11:00:00Z",
      },
      {
        id: "act-020",
        inspectionId: "snap-001",
        images: ["/foundation-construction.jpg"],
        postedBy: {
          name: "Juan Dela Cruz",
          role: "Structural Inspector",
          avatar: "/professional-man-avatar.png",
        },
        date: "2026-01-10T16:30:00Z",
        status: "verified",
        description: "Final compaction testing complete. All results exceed minimum requirements.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-10T16:30:00Z",
        updatedAt: "2026-01-10T16:30:00Z",
      },
    ],
    remarks: [],
  },
  "snap-002": {
    id: "snap-002",
    title: "Bridge Construction Assessment",
    projectNumber: "PROJ-2026-002",
    location: "Capas, Tarlac",
    coverImage: "/bridge-construction-over-river.jpg",
    status: "verified",
    inspector: {
      name: "Carlos Mendoza",
      role: "Bridge Engineer",
      avatar: "/engineer-avatar.png",
    },
    dateRecorded: "2026-01-01T11:24:27Z",
    activities: [
      {
        id: "act-003",
        inspectionId: "snap-002",
        images: ["/bridge-pillars-construction.jpg", "/bridge-deck-installation.jpg"],
        postedBy: {
          name: "Carlos Mendoza",
          role: "Bridge Engineer",
          avatar: "/engineer-avatar.png",
        },
        date: "2026-01-01T11:24:27Z",
        status: "verified",
        description:
          "Main support pillars completed and cured. Deck installation commenced with pre-stressed concrete segments. All safety protocols followed.",
        remarks: [],
        visibility: "public",
        createdAt: "2026-01-01T11:24:27Z",
        updatedAt: "2026-01-01T11:24:27Z",
      },
    ],
    remarks: [],
  },
}

export const MOCK_INSPECTIONS: Inspection[] = Object.values(MOCK_INSPECTOR_DATA)

export const MOCK_SNAPSHOTS: Record<string, Array<{ time: string; status: "blue" | "green"; id: string }>> = {
  "2026-01-30": [{ time: "14:30:00", status: "blue", id: "snap-001" }],
}
