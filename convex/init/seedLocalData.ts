// convex/init/seedLocalData.ts
// Focused seeder for local development - seeds budget, projects, breakdowns, 20% DF, Special Ed, Special Health, and Trust Funds
// For years: 2022, 2023, 2024, 2025, 2026

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const YEARS = [2022, 2023, 2024, 2025, 2026];

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

const OFFICES = ["CEO", "GSO", "CHO", "CSWD", "CPDO", "AGR", "VET", "CTO", "BPLO", "PEO", "PHO", "PSWDO"];

const PROJECT_TYPES = ["Construction", "Rehabilitation", "Improvement", "Repair", "Purchase", "Installation", "Concreting", "Upgrading"];
const PROJECT_OBJECTS = ["School Building", "Health Center", "Road", "Drainage System", "Multi-Purpose Hall", "Streetlights", "Water System", "Equipment", "Vehicles", "Medicines"];

const BUDGET_PARTICULARS = ["GAD", "LDRRMP", "LCCAP", "SC", "PWD", "MCPC", "20%_DF"];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomAmount = (min = 100000, max = 5000000) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

const generateProjectTitle = () => {
    const type = getRandomElement(PROJECT_TYPES);
    const obj = getRandomElement(PROJECT_OBJECTS);
    const brgy = getRandomElement(BARANGAYS);
    return `${type} of ${obj} in Brgy. ${brgy}`;
};

// ============================================================================
// MAIN SEEDER MUTATION
// ============================================================================

export const seedLocalData = mutation({
    args: {
        confirm: v.boolean(),
        itemCountPerYear: v.optional(v.number()), // How many items to create per year per type
    },
    handler: async (ctx, args) => {
        if (!args.confirm) {
            return { success: false, message: "Please confirm seeding by passing confirm: true" };
        }

        const now = Date.now();

        // Get or create an admin user for seeding
        let userId: Id<"users">;
        const existingUser = await ctx.db.query("users").first();
        if (existingUser) {
            userId = existingUser._id;
        } else {
            // Create a seed admin user
            userId = await ctx.db.insert("users", {
                name: "Seed Admin",
                email: "seed@local.dev",
                role: "super_admin",
                createdAt: now,
                updatedAt: now,
            });
            console.log("Created seed admin user:", userId);
        }
        const itemCount = args.itemCountPerYear || 5; // Default 5 items per year per type

        console.log(`Starting local data seeding for years: ${YEARS.join(", ")}`);
        console.log(`Creating ${itemCount} items per year for each entity type...`);

        const results = {
            fiscalYears: 0,
            budgetItems: 0,
            projects: 0,
            projectBreakdowns: 0,
            twentyPercentDF: 0,
            twentyPercentDFBreakdowns: 0,
            specialEducationFunds: 0,
            specialEducationFundBreakdowns: 0,
            specialHealthFunds: 0,
            specialHealthFundBreakdowns: 0,
            trustFunds: 0,
            trustFundBreakdowns: 0,
        };

        // 1. Seed Fiscal Years
        console.log("Seeding Fiscal Years...");
        for (const year of YEARS) {
            const existing = await ctx.db.query("fiscalYears").withIndex("year", q => q.eq("year", year)).first();
            if (!existing) {
                await ctx.db.insert("fiscalYears", {
                    year,
                    label: `FY ${year}-${year + 1}`,
                    isActive: true,
                    isCurrent: year === 2025,
                    createdBy: userId,
                    createdAt: now,
                    updatedAt: now,
                });
                results.fiscalYears++;
            }
        }

        // Get or create implementing agencies for reference
        let implementingAgencies = await ctx.db.query("implementingAgencies").withIndex("type", q => q.eq("type", "internal")).collect();
        let deptIds: Id<"implementingAgencies">[] = implementingAgencies.map(d => d._id);
        
        if (deptIds.length === 0) {
            // Create default implementing agencies
            const deptData = [
                { fullName: "Provincial Planning & Development Office", code: "PPDO" },
                { fullName: "Provincial Engineering Office", code: "PEO" },
                { fullName: "Provincial Health Office", code: "PHO" },
                { fullName: "Provincial Agriculture Office", code: "PAgO" },
                { fullName: "Provincial Social Welfare & Development", code: "PSWDO" },
                { fullName: "General Services Office", code: "GSO" },
                { fullName: "City Health Office", code: "CHO" },
                { fullName: "City Planning & Development Office", code: "CPDO" },
            ];
            for (const d of deptData) {
                const id = await ctx.db.insert("implementingAgencies", {
                    ...d,
                    type: "internal",
                    isActive: true,
                    createdBy: userId,
                    createdAt: now,
                    updatedAt: now,
                });
                deptIds.push(id);
            }
        }
        const getRandomDeptId = () => getRandomElement(deptIds);

        // 2. Seed Budget Items
        console.log("Seeding Budget Items...");
        const budgetItemIds: Record<number, Id<"budgetItems">[]> = {};
        for (const year of YEARS) {
            budgetItemIds[year] = [];
            for (let i = 0; i < itemCount; i++) {
                const allocated = getRandomAmount(500000, 10000000);
                const utilized = Math.floor(allocated * (0.3 + Math.random() * 0.6)); // 30-90% utilized
                const status = getRandomElement(["completed", "delayed", "ongoing"] as const);
                
                const id = await ctx.db.insert("budgetItems", {
                    particulars: getRandomElement(BUDGET_PARTICULARS),
                    totalBudgetAllocated: allocated,
                    totalBudgetUtilized: utilized,
                    obligatedBudget: Math.floor(utilized * 0.8),
                    utilizationRate: (utilized / allocated) * 100,
                    projectCompleted: status === "completed" ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3),
                    projectDelayed: status === "delayed" ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2),
                    projectsOngoing: status === "ongoing" ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3),
                    year,
                    fiscalYear: year,
                    status,
                    departmentId: getRandomDeptId() as any,
                    autoCalculateBudgetUtilized: false,
                    createdBy: userId,
                    createdAt: now - (2026 - year) * 31536000000,
                    updatedAt: now,
                });
                budgetItemIds[year].push(id);
                results.budgetItems++;
            }
        }

        // 3. Seed Projects with Breakdowns
        console.log("Seeding Projects and Breakdowns...");
        for (const year of YEARS) {
            for (let i = 0; i < itemCount; i++) {
                const allocated = getRandomAmount(200000, 3000000);
                const utilized = Math.floor(allocated * (0.2 + Math.random() * 0.7));
                const status = getRandomElement(["completed", "delayed", "ongoing"] as const);
                const budgetItemId = getRandomElement(budgetItemIds[year]);
                const deptId = getRandomDeptId();

                const projectId = await ctx.db.insert("projects", {
                    particulars: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    departmentId: deptId as any,
                    budgetItemId,
                    totalBudgetAllocated: allocated,
                    totalBudgetUtilized: utilized,
                    obligatedBudget: Math.floor(utilized * 0.75),
                    utilizationRate: (utilized / allocated) * 100,
                    projectCompleted: status === "completed" ? 1 : 0,
                    projectDelayed: status === "delayed" ? 1 : 0,
                    projectsOngoing: status === "ongoing" ? 1 : 0,
                    year,
                    status,
                    autoCalculateBudgetUtilized: false,
                    createdBy: userId,
                    createdAt: now - (2026 - year) * 31536000000,
                    updatedAt: now,
                });
                results.projects++;

                // Create breakdowns for this project
                const breakdownCount = Math.floor(Math.random() * 3) + 1;
                for (let b = 0; b < breakdownCount; b++) {
                    const bAllocated = Math.floor(allocated / breakdownCount);
                    const bUtilized = Math.floor(bAllocated * (0.3 + Math.random() * 0.6));
                    
                    await ctx.db.insert("govtProjectBreakdowns", {
                        projectId,
                        projectName: generateProjectTitle(),
                        projectTitle: generateProjectTitle(),
                        implementingOffice: getRandomElement(OFFICES),
                        municipality: "Tarlac City",
                        barangay: getRandomElement(BARANGAYS),
                        allocatedBudget: bAllocated,
                        budgetUtilized: bUtilized,
                        obligatedBudget: Math.floor(bUtilized * 0.8),
                        balance: bAllocated - bUtilized,
                        utilizationRate: (bUtilized / bAllocated) * 100,
                        projectAccomplishment: Math.floor(Math.random() * 100),
                        status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                        reportDate: now - Math.floor(Math.random() * 86400000 * 30),
                        createdBy: userId,
                        createdAt: now,
                        updatedAt: now,
                    });
                    results.projectBreakdowns++;
                }
            }
        }

        // 4. Seed 20% DF with Breakdowns
        console.log("Seeding 20% DF and Breakdowns...");
        for (const year of YEARS) {
            for (let i = 0; i < itemCount; i++) {
                const allocated = getRandomAmount(500000, 8000000);
                const utilized = Math.floor(allocated * (0.3 + Math.random() * 0.6));
                const status = getRandomElement(["completed", "delayed", "ongoing"] as const);
                const deptId = getRandomDeptId();

                const dfId = await ctx.db.insert("twentyPercentDF", {
                    particulars: generateProjectTitle(),
                    implementingOffice: getRandomElement(OFFICES),
                    departmentId: deptId as any,
                    budgetItemId: getRandomElement(budgetItemIds[year]),
                    totalBudgetAllocated: allocated,
                    totalBudgetUtilized: utilized,
                    obligatedBudget: Math.floor(utilized * 0.75),
                    utilizationRate: (utilized / allocated) * 100,
                    projectCompleted: status === "completed" ? 1 : 0,
                    projectDelayed: status === "delayed" ? 1 : 0,
                    projectsOngoing: status === "ongoing" ? 1 : 0,
                    year,
                    status,
                    autoCalculateBudgetUtilized: false,
                    createdBy: userId,
                    createdAt: now - (2026 - year) * 31536000000,
                    updatedAt: now,
                });
                results.twentyPercentDF++;

                // Create breakdowns
                const breakdownCount = Math.floor(Math.random() * 3) + 1;
                for (let b = 0; b < breakdownCount; b++) {
                    const bAllocated = Math.floor(allocated / breakdownCount);
                    const bUtilized = Math.floor(bAllocated * (0.3 + Math.random() * 0.6));
                    
                    await ctx.db.insert("twentyPercentDFBreakdowns", {
                        twentyPercentDFId: dfId,
                        projectName: generateProjectTitle(),
                        projectTitle: generateProjectTitle(),
                        implementingOffice: getRandomElement(OFFICES),
                        municipality: "Tarlac City",
                        barangay: getRandomElement(BARANGAYS),
                        allocatedBudget: bAllocated,
                        budgetUtilized: bUtilized,
                        obligatedBudget: Math.floor(bUtilized * 0.8),
                        balance: bAllocated - bUtilized,
                        utilizationRate: (bUtilized / bAllocated) * 100,
                        projectAccomplishment: Math.floor(Math.random() * 100),
                        status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                        reportDate: now - Math.floor(Math.random() * 86400000 * 30),
                        createdBy: userId,
                        createdAt: now,
                        updatedAt: now,
                    });
                    results.twentyPercentDFBreakdowns++;
                }
            }
        }

        // 5. Seed Special Education Funds with Breakdowns
        console.log("Seeding Special Education Funds and Breakdowns...");
        for (const year of YEARS) {
            for (let i = 0; i < itemCount; i++) {
                const received = getRandomAmount(300000, 5000000);
                const utilized = Math.floor(received * (0.3 + Math.random() * 0.6));
                const status = getRandomElement(["on_process", "ongoing", "completed"] as const);
                const deptId = getRandomDeptId();

                const sefId = await ctx.db.insert("specialEducationFunds", {
                    projectTitle: generateProjectTitle(),
                    officeInCharge: getRandomElement(OFFICES),
                    departmentId: deptId as any,
                    received,
                    utilized,
                    balance: received - utilized,
                    obligatedPR: Math.floor(utilized * 0.8),
                    utilizationRate: (utilized / received) * 100,
                    status,
                    year,
                    fiscalYear: year,
                    projectCompleted: status === "completed" ? Math.floor(Math.random() * 3) + 1 : 0,
                    projectDelayed: Math.floor(Math.random() * 2),
                    projectsOngoing: status === "ongoing" ? Math.floor(Math.random() * 3) + 1 : 0,
                    autoCalculateFinancials: false,
                    createdBy: userId,
                    createdAt: now - (2026 - year) * 31536000000,
                    updatedAt: now,
                });
                results.specialEducationFunds++;

                // Create breakdowns
                const breakdownCount = Math.floor(Math.random() * 3) + 1;
                for (let b = 0; b < breakdownCount; b++) {
                    const bAllocated = Math.floor(received / breakdownCount);
                    const bUtilized = Math.floor(bAllocated * (0.3 + Math.random() * 0.6));
                    
                    await ctx.db.insert("specialEducationFundBreakdowns", {
                        specialEducationFundId: sefId,
                        projectName: generateProjectTitle(),
                        projectTitle: generateProjectTitle(),
                        implementingOffice: getRandomElement(OFFICES),
                        municipality: "Tarlac City",
                        barangay: getRandomElement(BARANGAYS),
                        allocatedBudget: bAllocated,
                        budgetUtilized: bUtilized,
                        obligatedBudget: Math.floor(bUtilized * 0.8),
                        balance: bAllocated - bUtilized,
                        utilizationRate: (bUtilized / bAllocated) * 100,
                        projectAccomplishment: Math.floor(Math.random() * 100),
                        status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                        reportDate: now - Math.floor(Math.random() * 86400000 * 30),
                        createdBy: userId,
                        createdAt: now,
                        updatedAt: now,
                    });
                    results.specialEducationFundBreakdowns++;
                }
            }
        }

        // 6. Seed Special Health Funds with Breakdowns
        console.log("Seeding Special Health Funds and Breakdowns...");
        for (const year of YEARS) {
            for (let i = 0; i < itemCount; i++) {
                const received = getRandomAmount(400000, 6000000);
                const utilized = Math.floor(received * (0.3 + Math.random() * 0.6));
                const status = getRandomElement(["on_process", "ongoing", "completed"] as const);
                const deptId = getRandomDeptId();

                const shfId = await ctx.db.insert("specialHealthFunds", {
                    projectTitle: generateProjectTitle(),
                    officeInCharge: getRandomElement(OFFICES),
                    departmentId: deptId as any,
                    received,
                    utilized,
                    balance: received - utilized,
                    obligatedPR: Math.floor(utilized * 0.8),
                    utilizationRate: (utilized / received) * 100,
                    status,
                    year,
                    fiscalYear: year,
                    projectCompleted: status === "completed" ? Math.floor(Math.random() * 3) + 1 : 0,
                    projectDelayed: Math.floor(Math.random() * 2),
                    projectsOngoing: status === "ongoing" ? Math.floor(Math.random() * 3) + 1 : 0,
                    autoCalculateFinancials: false,
                    createdBy: userId,
                    createdAt: now - (2026 - year) * 31536000000,
                    updatedAt: now,
                });
                results.specialHealthFunds++;

                // Create breakdowns
                const breakdownCount = Math.floor(Math.random() * 3) + 1;
                for (let b = 0; b < breakdownCount; b++) {
                    const bAllocated = Math.floor(received / breakdownCount);
                    const bUtilized = Math.floor(bAllocated * (0.3 + Math.random() * 0.6));
                    
                    await ctx.db.insert("specialHealthFundBreakdowns", {
                        specialHealthFundId: shfId,
                        projectName: generateProjectTitle(),
                        projectTitle: generateProjectTitle(),
                        implementingOffice: getRandomElement(OFFICES),
                        municipality: "Tarlac City",
                        barangay: getRandomElement(BARANGAYS),
                        allocatedBudget: bAllocated,
                        budgetUtilized: bUtilized,
                        obligatedBudget: Math.floor(bUtilized * 0.8),
                        balance: bAllocated - bUtilized,
                        utilizationRate: (bUtilized / bAllocated) * 100,
                        projectAccomplishment: Math.floor(Math.random() * 100),
                        status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                        reportDate: now - Math.floor(Math.random() * 86400000 * 30),
                        createdBy: userId,
                        createdAt: now,
                        updatedAt: now,
                    });
                    results.specialHealthFundBreakdowns++;
                }
            }
        }

        // 7. Seed Trust Funds with Breakdowns
        console.log("Seeding Trust Funds and Breakdowns...");
        for (const year of YEARS) {
            for (let i = 0; i < itemCount; i++) {
                const received = getRandomAmount(500000, 10000000);
                const utilized = Math.floor(received * (0.3 + Math.random() * 0.6));
                const status = getRandomElement(["on_process", "ongoing", "completed"] as const);
                const deptId = getRandomDeptId();

                const tfId = await ctx.db.insert("trustFunds", {
                    projectTitle: generateProjectTitle(),
                    officeInCharge: getRandomElement(OFFICES),
                    departmentId: deptId as any,
                    received,
                    utilized,
                    balance: received - utilized,
                    obligatedPR: Math.floor(utilized * 0.8),
                    utilizationRate: (utilized / received) * 100,
                    status,
                    year,
                    fiscalYear: year,
                    projectCompleted: status === "completed" ? Math.floor(Math.random() * 3) + 1 : 0,
                    projectDelayed: Math.floor(Math.random() * 2),
                    projectsOngoing: status === "ongoing" ? Math.floor(Math.random() * 3) + 1 : 0,
                    autoCalculateFinancials: false,
                    createdBy: userId,
                    createdAt: now - (2026 - year) * 31536000000,
                    updatedAt: now,
                });
                results.trustFunds++;

                // Create breakdowns
                const breakdownCount = Math.floor(Math.random() * 3) + 1;
                for (let b = 0; b < breakdownCount; b++) {
                    const bAllocated = Math.floor(received / breakdownCount);
                    const bUtilized = Math.floor(bAllocated * (0.3 + Math.random() * 0.6));
                    
                    await ctx.db.insert("trustFundBreakdowns", {
                        trustFundId: tfId,
                        projectName: generateProjectTitle(),
                        projectTitle: generateProjectTitle(),
                        implementingOffice: getRandomElement(OFFICES),
                        municipality: "Tarlac City",
                        barangay: getRandomElement(BARANGAYS),
                        allocatedBudget: bAllocated,
                        budgetUtilized: bUtilized,
                        obligatedBudget: Math.floor(bUtilized * 0.8),
                        balance: bAllocated - bUtilized,
                        utilizationRate: (bUtilized / bAllocated) * 100,
                        projectAccomplishment: Math.floor(Math.random() * 100),
                        status: getRandomElement(["completed", "delayed", "ongoing"] as const),
                        reportDate: now - Math.floor(Math.random() * 86400000 * 30),
                        createdBy: userId,
                        createdAt: now,
                        updatedAt: now,
                    });
                    results.trustFundBreakdowns++;
                }
            }
        }

        console.log("Local data seeding completed!");
        console.log("Results:", results);

        return {
            success: true,
            message: `Successfully seeded data for years ${YEARS.join(", ")}`,
            results,
        };
    },
});

// ============================================================================
// CLEAR DATA MUTATION
// ============================================================================

export const clearAllSeededData = mutation({
    args: {
        confirm: v.boolean(),
    },
    handler: async (ctx, args) => {
        if (!args.confirm) {
            return { success: false, message: "Please confirm deletion by passing confirm: true" };
        }

        const results = {
            fiscalYears: 0,
            budgetItems: 0,
            projects: 0,
            projectBreakdowns: 0,
            twentyPercentDF: 0,
            twentyPercentDFBreakdowns: 0,
            specialEducationFunds: 0,
            specialEducationFundBreakdowns: 0,
            specialHealthFunds: 0,
            specialHealthFundBreakdowns: 0,
            trustFunds: 0,
            trustFundBreakdowns: 0,
        };

        // Clear all tables
        const tables = [
            { name: "fiscalYears", key: "fiscalYears" },
            { name: "budgetItems", key: "budgetItems" },
            { name: "projects", key: "projects" },
            { name: "govtProjectBreakdowns", key: "projectBreakdowns" },
            { name: "twentyPercentDF", key: "twentyPercentDF" },
            { name: "twentyPercentDFBreakdowns", key: "twentyPercentDFBreakdowns" },
            { name: "specialEducationFunds", key: "specialEducationFunds" },
            { name: "specialEducationFundBreakdowns", key: "specialEducationFundBreakdowns" },
            { name: "specialHealthFunds", key: "specialHealthFunds" },
            { name: "specialHealthFundBreakdowns", key: "specialHealthFundBreakdowns" },
            { name: "trustFunds", key: "trustFunds" },
            { name: "trustFundBreakdowns", key: "trustFundBreakdowns" },
        ] as const;

        for (const table of tables) {
            const items = await ctx.db.query(table.name).collect();
            for (const item of items) {
                await ctx.db.delete(item._id);
            }
            results[table.key] = items.length;
        }

        return {
            success: true,
            message: "All seeded data cleared successfully",
            results,
        };
    },
});
