export const getParticularFullName = (particular: string): string => {
  const mapping: { [key: string]: string } = {
    GAD: "Gender and Development (GAD)",
    LDRRMP: "Local Disaster Risk Reduction and Management Plan",
    LCCAP: "Local Climate Change Action Plan",
    LCPC: "Local Council for the Protection of Children",
    SCPD: "Sectoral Committee for Persons with Disabilities",
    POPS: "Provincial Operations",
    CAIDS: "Community Affairs and Information Development Services",
    LNP: "Local Nutrition Program",
    PID: "Provincial Information Department",
    ACDP: "Agricultural Competitiveness Development Program",
    LYDP: "Local Youth Development Program",
    "20%_DF": "20% Development Fund",
  };
  return mapping[particular] || particular;
};

export const calculateProjectStats = (projects: any[]) => {
  const totalAllocated = projects.reduce(
    (sum, project) => sum + project.totalBudgetAllocated,
    0
  );
  const totalUtilized = projects.reduce(
    (sum, project) => sum + project.totalBudgetUtilized,
    0
  );
  const avgUtilizationRate =
    projects.length > 0
      ? projects.reduce((sum, project) => sum + project.utilizationRate, 0) /
        projects.length
      : 0;

  return {
    totalAllocated,
    totalUtilized,
    avgUtilizationRate,
  };
};
