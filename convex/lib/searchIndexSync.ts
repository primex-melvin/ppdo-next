import { MutationCtx } from "../_generated/server";
import { indexEntity } from "../search/index";
import { buildSlug } from "./searchUtils";

type SyncOptions = {
  isDeleted?: boolean;
};

function resolveDeletedFlag(record: any, options?: SyncOptions) {
  if (options?.isDeleted !== undefined) return options.isDeleted;
  return record?.isDeleted === true;
}

function asStringId(id: any): string | undefined {
  return id ? String(id) : undefined;
}

function sharedIndexMeta(record: any) {
  return {
    createdBy: record?.createdBy,
    createdAt: record?.createdAt,
    updatedAt: record?.updatedAt,
  };
}

export async function syncBudgetItemSearchIndex(
  ctx: MutationCtx,
  budgetItem: any,
  options?: SyncOptions
) {
  if (!budgetItem) return;

  await indexEntity(ctx, {
    entityType: "budgetItem",
    entityId: asStringId(budgetItem._id) || "",
    primaryText: budgetItem.particulars || "",
    secondaryText: undefined,
    departmentId: budgetItem.departmentId,
    status: budgetItem.status,
    year: budgetItem.year,
    isDeleted: resolveDeletedFlag(budgetItem, options),
    ...sharedIndexMeta(budgetItem),
  });
}

export async function syncProjectSearchIndex(
  ctx: MutationCtx,
  project: any,
  options?: SyncOptions
) {
  if (!project) return;

  let parentSlug: string | undefined;
  let parentId: string | undefined;
  if (project.budgetItemId) {
    const budgetItem = (await ctx.db.get(project.budgetItemId)) as any;
    if (budgetItem) {
      parentSlug = encodeURIComponent(budgetItem.particulars);
      parentId = asStringId(budgetItem._id);
    }
  }

  await indexEntity(ctx, {
    entityType: "projectItem",
    entityId: asStringId(project._id) || "",
    primaryText: project.particulars || "",
    secondaryText: project.implementingOffice,
    departmentId: project.departmentId,
    status: project.status,
    year: project.year,
    parentSlug,
    parentId,
    isDeleted: resolveDeletedFlag(project, options),
    ...sharedIndexMeta(project),
  });
}

export async function syncProjectBreakdownSearchIndex(
  ctx: MutationCtx,
  breakdown: any,
  options?: SyncOptions
) {
  if (!breakdown) return;

  let parentSlug: string | undefined;
  let parentId: string | undefined;
  let year: number | undefined;

  if (breakdown.projectId) {
    const project = (await ctx.db.get(breakdown.projectId)) as any;
    if (project) {
      year = project.year;
      parentId = asStringId(project._id);

      if (project.budgetItemId) {
        const budgetItem = (await ctx.db.get(project.budgetItemId)) as any;
        if (budgetItem) {
          parentSlug = `${encodeURIComponent(budgetItem.particulars)}/${buildSlug(
            project.particulars,
            asStringId(project._id) || ""
          )}`;
        }
      }
    }
  }

  await indexEntity(ctx, {
    entityType: "projectBreakdown",
    entityId: asStringId(breakdown._id) || "",
    primaryText: breakdown.projectName || "",
    secondaryText: breakdown.implementingOffice,
    departmentId: undefined,
    status: breakdown.status,
    year,
    parentSlug,
    parentId,
    isDeleted: resolveDeletedFlag(breakdown, options),
    ...sharedIndexMeta(breakdown),
  });
}

async function syncFundBreakdownSearchIndex(
  ctx: MutationCtx,
  breakdown: any,
  args: {
    entityType:
      | "twentyPercentDFItem"
      | "trustFundItem"
      | "specialEducationFundItem"
      | "specialHealthFundItem";
    parentField:
      | "twentyPercentDFId"
      | "trustFundId"
      | "specialEducationFundId"
      | "specialHealthFundId";
    parentTitleField: "particulars" | "projectTitle";
  },
  options?: SyncOptions
) {
  if (!breakdown) return;

  let parentSlug: string | undefined;
  let parentId: string | undefined;
  let year: number | undefined;

  const parentRef = breakdown[args.parentField];
  if (parentRef) {
    const parent = (await ctx.db.get(parentRef)) as any;
    if (parent) {
      year = parent.year;
      parentId = asStringId(parent._id);
      const parentTitle = parent[args.parentTitleField] || "";
      parentSlug = buildSlug(parentTitle, asStringId(parent._id) || "");
    }
  }

  await indexEntity(ctx, {
    entityType: args.entityType,
    entityId: asStringId(breakdown._id) || "",
    primaryText: breakdown.projectName || "",
    secondaryText: breakdown.implementingOffice,
    departmentId: undefined,
    status: breakdown.status,
    year,
    parentSlug,
    parentId,
    isDeleted: resolveDeletedFlag(breakdown, options),
    ...sharedIndexMeta(breakdown),
  });
}

export async function syncTwentyPercentDFBreakdownSearchIndex(
  ctx: MutationCtx,
  breakdown: any,
  options?: SyncOptions
) {
  return syncFundBreakdownSearchIndex(
    ctx,
    breakdown,
    {
      entityType: "twentyPercentDFItem",
      parentField: "twentyPercentDFId",
      parentTitleField: "particulars",
    },
    options
  );
}

export async function syncTrustFundBreakdownSearchIndex(
  ctx: MutationCtx,
  breakdown: any,
  options?: SyncOptions
) {
  return syncFundBreakdownSearchIndex(
    ctx,
    breakdown,
    {
      entityType: "trustFundItem",
      parentField: "trustFundId",
      parentTitleField: "projectTitle",
    },
    options
  );
}

export async function syncSpecialEducationFundBreakdownSearchIndex(
  ctx: MutationCtx,
  breakdown: any,
  options?: SyncOptions
) {
  return syncFundBreakdownSearchIndex(
    ctx,
    breakdown,
    {
      entityType: "specialEducationFundItem",
      parentField: "specialEducationFundId",
      parentTitleField: "projectTitle",
    },
    options
  );
}

export async function syncSpecialHealthFundBreakdownSearchIndex(
  ctx: MutationCtx,
  breakdown: any,
  options?: SyncOptions
) {
  return syncFundBreakdownSearchIndex(
    ctx,
    breakdown,
    {
      entityType: "specialHealthFundItem",
      parentField: "specialHealthFundId",
      parentTitleField: "projectTitle",
    },
    options
  );
}

export async function syncBreakdownSearchIndexByTable(
  ctx: MutationCtx,
  tableName:
    | "govtProjectBreakdowns"
    | "trustFundBreakdowns"
    | "specialEducationFundBreakdowns"
    | "specialHealthFundBreakdowns"
    | "twentyPercentDFBreakdowns",
  breakdown: any,
  options?: SyncOptions
) {
  switch (tableName) {
    case "govtProjectBreakdowns":
      return syncProjectBreakdownSearchIndex(ctx, breakdown, options);
    case "trustFundBreakdowns":
      return syncTrustFundBreakdownSearchIndex(ctx, breakdown, options);
    case "specialEducationFundBreakdowns":
      return syncSpecialEducationFundBreakdownSearchIndex(ctx, breakdown, options);
    case "specialHealthFundBreakdowns":
      return syncSpecialHealthFundBreakdownSearchIndex(ctx, breakdown, options);
    case "twentyPercentDFBreakdowns":
      return syncTwentyPercentDFBreakdownSearchIndex(ctx, breakdown, options);
  }
}
