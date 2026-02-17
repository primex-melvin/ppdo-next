import { v } from "convex/values";
import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const BARANGAYS = [
    "Aguso", "Alvindia", "Amucao", "Armenia", "Asturias", "Atioc", "Balanti", "Balete", "Balibago I", "Balibago II",
    "Balingcanaway", "Banaba", "Bantog", "Baras-baras", "Batang-batang", "Binauganan", "Bora", "Buenavista", "Buhilit",
    "Burot", "Calingcuan", "Capehan", "Carangian", "Care", "Central", "Culipat", "Cut-cut I", "Cut-cut II", "Dalayap",
    "Dela Paz", "Dolores", "Ligtasan", "Lourdes", "Mabini", "Maligaya", "Maliwalo", "Mapalacsiao", "Mapalad", "Matatalaib",
    "Paraiso", "Poblacion", "Salapungan", "San Carlos", "San Francisco", "San Isidro", "San Jose", "San Juan Bautista",
    "San Juan de Mata", "San Luis", "San Manuel", "San Miguel", "San Nicolas", "San Pablo", "San Pascual", "San Rafael",
    "San Roque", "San Sebastian", "San Vicente", "Santa Cruz", "Santa Maria", "Santo Cristo", "Santo Domingo", "Santo Niño",
    "Sapang Maragul", "Sapang Tagalog", "Sepung Calzada", "Sinait", "Suizo", "Tariji", "Tibag", "Tibagan", "Trinidad",
    "Ungot", "Villa Bacolor"
];

const OFFICES = ["CEO", "GSO", "CHO", "CSWD", "CPDO", "AGR", "VET", "CTO", "BPLO"];

const PROJECT_TYPES = ["Construction", "Rehabilitation", "Improvement", "Repair", "Purchase", "Installation", "Concreting", "Upgrading"];
const PROJECT_OBJECTS = ["School Building", "Health Center", "Road", "Drainage System", "Multi-Purpose Hall", "Streetlights", "Water System", "Equipment", "Vehicles", "Medicines"];

// const START_DATE = new Date("2023-01-01").getTime();
// const END_DATE = new Date("2026-01-31").getTime();

const getRandomDate = (startYear = 2023, endYear = 2026) => {
    const start = new Date(`${startYear}-01-01`).getTime();
    const end = new Date(`${endYear}-01-31`).getTime();
    return new Date(start + Math.random() * (end - start)).getTime();
};

const getRandomAmount = () => {
    const isMillion = Math.random() < 0.3; // 30% chance of million
    if (isMillion) {
        // 1M to 100M
        return Math.floor(Math.random() * 99_000_000) + 1_000_000;
    } else {
        // 100k to 900k
        return Math.floor(Math.random() * 800_000) + 100_000;
    }
};

const getRandomElement = <T>(arr: T[] | readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateProjectTitle = () => {
    const type = getRandomElement(PROJECT_TYPES);
    const obj = getRandomElement(PROJECT_OBJECTS);
    const brgy = getRandomElement(BARANGAYS);
    return `${type} of ${obj} in Brgy. ${brgy}`;
};

// ============================================================================
// QUERIES
// ============================================================================

export const getFirstUser = internalQuery({
    args: {},
    handler: async (ctx) => {
        const user = await ctx.db.query("users").first();
        return user?._id;
    },
});

export const getDepartments = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("implementingAgencies").withIndex("type", q => q.eq("type", "internal")).collect();
    }
});

// ============================================================================
// MUTATIONS
// ============================================================================

// --- Batch Insert Helper ---
// Since we have different tables, we'll create specific mutations for each.

// 1. Budget Items
export const seedBudgetItems = internalMutation({
    args: {
        data: v.array(v.object({
            particulars: v.string(),
            totalBudgetAllocated: v.number(),
            totalBudgetUtilized: v.number(),
            utilizationRate: v.number(),
            projectCompleted: v.number(),
            projectDelayed: v.number(),
            projectsOngoing: v.number(),
            year: v.number(),
            status: v.union(v.literal("completed"), v.literal("delayed"), v.literal("ongoing")),
            fiscalYear: v.number(),
            createdBy: v.id("users"),
            createdAt: v.number(),
            updatedAt: v.number(),
            departmentId: v.optional(v.id("implementingAgencies")),
        }))
    },
    handler: async (ctx, args) => {
        const ids = [];
        for (const item of args.data) {
            const id = await ctx.db.insert("budgetItems", item);
            ids.push(id);
        }
        return ids;
    }
});

// 2. Projects
export const seedProjects = internalMutation({
    args: {
        data: v.array(v.object({
            particulars: v.string(),
            implementingOffice: v.string(),
            departmentId: v.optional(v.id("implementingAgencies")),
            budgetItemId: v.optional(v.id("budgetItems")),
            totalBudgetAllocated: v.number(),
            totalBudgetUtilized: v.number(),
            utilizationRate: v.number(),
            projectCompleted: v.number(),
            projectDelayed: v.number(),
            projectsOngoing: v.number(),
            year: v.number(),
            status: v.union(v.literal("completed"), v.literal("delayed"), v.literal("ongoing")),
            createdBy: v.id("users"),
            createdAt: v.number(),
            updatedAt: v.number(),
        }))
    },
    handler: async (ctx, args) => {
        const ids = [];
        for (const item of args.data) {
            const id = await ctx.db.insert("projects", item);
            ids.push(id);
        }
        return ids;
    }
});

// 3. Govt Project Breakdowns (Children of Projects)
export const seedGovtProjectBreakdowns = internalMutation({
    args: {
        data: v.array(v.any()) // Using any to avoid huge schema duplication here for internal tool
    },
    handler: async (ctx, args) => {
        for (const item of args.data) {
            await ctx.db.insert("govtProjectBreakdowns", item);
        }
    }
});


// 4. Special Health Funds
export const seedSpecialHealthFunds = internalMutation({
    args: {
        data: v.array(v.any())
    },
    handler: async (ctx, args) => {
        const ids = [];
        for (const item of args.data) {
            const id = await ctx.db.insert("specialHealthFunds", item);
            ids.push(id);
        }
        return ids;
    }
});

export const seedSpecialHealthFundBreakdowns = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        for (const item of args.data) {
            await ctx.db.insert("specialHealthFundBreakdowns", item);
        }
    }
});

// 5. Special Education Funds
export const seedSpecialEducationFunds = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        const ids = [];
        for (const item of args.data) {
            const id = await ctx.db.insert("specialEducationFunds", item);
            ids.push(id);
        }
        return ids;
    }
});

export const seedSpecialEducationFundBreakdowns = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        for (const item of args.data) {
            await ctx.db.insert("specialEducationFundBreakdowns", item);
        }
    }
});

// 6. 20% DF
export const seedTwentyPercentDF = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        const ids = [];
        for (const item of args.data) {
            const id = await ctx.db.insert("twentyPercentDF", item);
            ids.push(id);
        }
        return ids;
    }
});

export const seedTwentyPercentDFBreakdowns = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        for (const item of args.data) {
            await ctx.db.insert("twentyPercentDFBreakdowns", item);
        }
    }
});

// 7. Trust Funds
export const seedTrustFunds = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        const ids = [];
        for (const item of args.data) {
            const id = await ctx.db.insert("trustFunds", item);
            ids.push(id);
        }
        return ids;
    }
});

export const seedTrustFundBreakdowns = internalMutation({
    args: { data: v.array(v.any()) },
    handler: async (ctx, args) => {
        for (const item of args.data) {
            await ctx.db.insert("trustFundBreakdowns", item);
        }
    }
});


// ============================================================================
// ACTION (Orchestrator)
// ============================================================================

export const seedData = internalAction({
    args: {},
    handler: async (ctx) => {
        const userId = await ctx.runQuery(internal.seedData.getFirstUser);
        if (!userId) {
            console.error("No user found. Please create a user first.");
            return;
        }

        const departments = await ctx.runQuery(internal.seedData.getDepartments);
        const deptIds = departments.map(d => d._id);

        const TARGET_COUNT = 1000;
        const BATCH_SIZE = 100;

        // --- Helper to get random dept ID ---
        const getRandomDeptId = () => deptIds.length > 0 ? getRandomElement(deptIds) : undefined;

        console.log("Starting Seeding Process...");

        // 1. Budget Items & Attributes
        // Since we need to link projects to budget items, let's create budget items first.
        let budgetItemIds: Id<"budgetItems">[] = [];

        console.log("Seeding Budget Items...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * (0.5 + Math.random() * 0.5)); // 50-100% utilization

                batch.push({
                    particulars: getRandomElement(["GAD", "LDRRMP", "LCCAP", "SC", "PWD", "MCPC"]),
                    totalBudgetAllocated: alloc,
                    totalBudgetUtilized: util,
                    utilizationRate: (util / alloc) * 100,
                    projectCompleted: Math.floor(Math.random() * 10),
                    projectDelayed: Math.floor(Math.random() * 5),
                    projectsOngoing: Math.floor(Math.random() * 5),
                    year: year,
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    fiscalYear: year,
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                    updatedAt: getRandomDate(year, year),
                    departmentId: getRandomDeptId() as any,
                });
            }
            const ids = await ctx.runMutation(internal.seedData.seedBudgetItems, { data: batch });
            budgetItemIds = [...budgetItemIds, ...ids];
        }

        // 2. Projects (linked to Budget Items)
        let projectIds: Id<"projects">[] = [];
        console.log("Seeding Projects...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * (Math.random()));

                batch.push({
                    particulars: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    departmentId: getRandomDeptId() as any,
                    budgetItemId: getRandomElement(budgetItemIds),
                    totalBudgetAllocated: alloc,
                    totalBudgetUtilized: util,
                    utilizationRate: (util / alloc) * 100,
                    projectCompleted: 0,
                    projectDelayed: 0,
                    projectsOngoing: 1,
                    year: year,
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                    updatedAt: getRandomDate(year, year),
                });
            }
            const ids = await ctx.runMutation(internal.seedData.seedProjects, { data: batch });
            projectIds = [...projectIds, ...ids];
        }

        // 3. Govt Project Breakdowns
        console.log("Seeding Govt Project Breakdowns...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * Math.random());

                batch.push({
                    projectId: getRandomElement(projectIds),
                    projectName: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    projectTitle: generateProjectTitle(),
                    municipality: "Tarlac City",
                    barangay: getRandomElement(BARANGAYS),
                    allocatedBudget: alloc,
                    budgetUtilized: util,
                    balance: alloc - util,
                    utilizationRate: (util / alloc) * 100,
                    projectAccomplishment: Math.floor(Math.random() * 100),
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    reportDate: getRandomDate(year, year),
                    isDeleted: false,
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                });
            }
            await ctx.runMutation(internal.seedData.seedGovtProjectBreakdowns, { data: batch });
        }

        // 4. Special Health Funds & Breakdowns
        console.log("Seeding Special Health Funds...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            // Parents
            const batchParents = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const received = getRandomAmount();
                const util = Math.floor(received * Math.random());

                batchParents.push({
                    projectTitle: generateProjectTitle(),
                    officeInCharge: getRandomElement(OFFICES),
                    departmentId: getRandomDeptId() as any,
                    received: received,
                    utilized: util,
                    balance: received - util,
                    utilizationRate: (util / received) * 100,
                    status: getRandomElement(["on_process", "ongoing", "completed"]),
                    year: year,
                    fiscalYear: year,
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                    updatedAt: getRandomDate(year, year),
                });
            }
            const parentIds = await ctx.runMutation(internal.seedData.seedSpecialHealthFunds, { data: batchParents });

            // Breakdowns (1 per parent for simplicity as we target 1000 sets total)
            const batchBreakdowns = [];
            for (const pid of parentIds) {
                const year = 2024; // Simplifying date for breakdown logic
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * Math.random());

                batchBreakdowns.push({
                    specialHealthFundId: pid,
                    projectName: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    municipality: "Tarlac City",
                    barangay: getRandomElement(BARANGAYS),
                    allocatedBudget: alloc,
                    budgetUtilized: util,
                    balance: alloc - util,
                    utilizationRate: (util / alloc) * 100,
                    projectAccomplishment: Math.floor(Math.random() * 100),
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    reportDate: getRandomDate(),
                    createdBy: userId,
                    createdAt: getRandomDate(),
                });
            }
            await ctx.runMutation(internal.seedData.seedSpecialHealthFundBreakdowns, { data: batchBreakdowns });
        }

        // 5. Special Education Funds & Breakdowns (Similar logic)
        console.log("Seeding Special Education Funds...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            const batchParents = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const received = getRandomAmount();
                const util = Math.floor(received * Math.random());

                batchParents.push({
                    projectTitle: generateProjectTitle(),
                    officeInCharge: getRandomElement(OFFICES),
                    departmentId: getRandomDeptId() as any,
                    received: received,
                    utilized: util,
                    balance: received - util,
                    utilizationRate: (util / received) * 100,
                    status: getRandomElement(["on_process", "ongoing", "completed"]),
                    year: year,
                    fiscalYear: year,
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                    updatedAt: getRandomDate(year, year),
                });
            }
            const parentIds = await ctx.runMutation(internal.seedData.seedSpecialEducationFunds, { data: batchParents });

            const batchBreakdowns = [];
            for (const pid of parentIds) {
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * Math.random());
                batchBreakdowns.push({
                    specialEducationFundId: pid,
                    projectName: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    municipality: "Tarlac City",
                    barangay: getRandomElement(BARANGAYS),
                    allocatedBudget: alloc,
                    budgetUtilized: util,
                    balance: alloc - util,
                    utilizationRate: (util / alloc) * 100,
                    projectAccomplishment: Math.floor(Math.random() * 100),
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    reportDate: getRandomDate(),
                    createdBy: userId,
                    createdAt: getRandomDate(),
                });
            }
            await ctx.runMutation(internal.seedData.seedSpecialEducationFundBreakdowns, { data: batchBreakdowns });
        }

        // 6. Twenty Percent DF & Breakdowns
        console.log("Seeding 20% DF...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            const batchParents = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * Math.random());

                batchParents.push({
                    particulars: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    departmentId: getRandomDeptId() as any,
                    budgetItemId: getRandomElement(budgetItemIds),
                    totalBudgetAllocated: alloc,
                    totalBudgetUtilized: util,
                    utilizationRate: (util / alloc) * 100,
                    projectCompleted: 0,
                    projectDelayed: 0,
                    projectsOngoing: 1,
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    year: year,
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                    updatedAt: getRandomDate(year, year),
                });
            }
            const parentIds = await ctx.runMutation(internal.seedData.seedTwentyPercentDF, { data: batchParents });

            const batchBreakdowns = [];
            for (const pid of parentIds) {
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * Math.random());
                batchBreakdowns.push({
                    twentyPercentDFId: pid,
                    projectName: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    municipality: "Tarlac City",
                    barangay: getRandomElement(BARANGAYS),
                    allocatedBudget: alloc,
                    budgetUtilized: util,
                    balance: alloc - util,
                    utilizationRate: (util / alloc) * 100,
                    projectAccomplishment: Math.floor(Math.random() * 100),
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    reportDate: getRandomDate(),
                    createdBy: userId,
                    createdAt: getRandomDate(),
                });
            }
            await ctx.runMutation(internal.seedData.seedTwentyPercentDFBreakdowns, { data: batchBreakdowns });
        }

        // 7. Trust Funds & Breakdowns
        console.log("Seeding Trust Funds...");
        for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
            const batchParents = [];
            for (let j = 0; j < BATCH_SIZE && i + j < TARGET_COUNT; j++) {
                const year = getRandomElement([2023, 2024, 2025, 2026]);
                const received = getRandomAmount();
                const util = Math.floor(received * Math.random());

                batchParents.push({
                    projectTitle: generateProjectTitle(),
                    officeInCharge: getRandomElement(OFFICES),
                    departmentId: getRandomDeptId() as any,
                    received: received,
                    utilized: util,
                    balance: received - util,
                    utilizationRate: (util / received) * 100,
                    status: getRandomElement(["on_process", "ongoing", "completed"]),
                    year: year,
                    fiscalYear: year,
                    createdBy: userId,
                    createdAt: getRandomDate(year, year),
                    updatedAt: getRandomDate(year, year),
                });
            }
            const parentIds = await ctx.runMutation(internal.seedData.seedTrustFunds, { data: batchParents });

            const batchBreakdowns = [];
            for (const pid of parentIds) {
                const alloc = getRandomAmount();
                const util = Math.floor(alloc * Math.random());
                batchBreakdowns.push({
                    trustFundId: pid,
                    projectName: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    municipality: "Tarlac City",
                    barangay: getRandomElement(BARANGAYS),
                    allocatedBudget: alloc,
                    budgetUtilized: util,
                    balance: alloc - util,
                    utilizationRate: (util / alloc) * 100,
                    projectAccomplishment: Math.floor(Math.random() * 100),
                    status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                    reportDate: getRandomDate(),
                    createdBy: userId,
                    createdAt: getRandomDate(),
                });
            }
            await ctx.runMutation(internal.seedData.seedTrustFundBreakdowns, { data: batchBreakdowns });
        }

        console.log("Seeding Complete!");
    }
});
