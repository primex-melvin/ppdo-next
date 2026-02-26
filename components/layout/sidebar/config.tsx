import {
    LayoutDashboard,
    Gauge,
    FileEdit,
    Settings as SettingsIcon,
    Wallet,
    LockKeyhole,
    FileText,
    GraduationCap,
    HeartPulse,
    TrendingUp,
    Building,
} from "lucide-react";
import { NavItem } from "./types";
import { BugsBadge, SuggestionsBadge } from "./badges/UpdatesBadges";

export const STATIC_NAV_ITEMS: NavItem[] = [
    {
        name: "Dashboard",
        href: "/dashboard",
        category: "My Workspace",
        icon: <LayoutDashboard size={20} />,
    },
    {
        name: "Personal KPI",
        href: "/dashboard/personal-kpi",
        category: "My Workspace",
        icon: <Gauge size={20} />,
    },
    {
        name: "Projects (11 plans)",
        href: "/dashboard/project",
        category: "Department",
        icon: <Wallet size={20} />,
    },
    {
        name: "20% DF",
        href: "/dashboard/20_percent_df",
        category: "Department",
        icon: <TrendingUp size={20} />,
        // isNew: true,
    },
    {
        name: "Trust Funds (Project Organs)",
        href: "/dashboard/trust-funds",
        category: "Department",
        icon: <LockKeyhole size={20} />,
    },
    {
        name: "Special Education Funds",
        href: "/dashboard/special-education-funds",
        category: "Department",
        icon: <GraduationCap size={20} />,
        // isNew: true,
    },
    {
        name: "Special Health Funds",
        href: "/dashboard/special-health-funds",
        category: "Department",
        icon: <HeartPulse size={20} />,
        // isNew: true,
    },
    {
        name: "Particulars",
        href: "/dashboard/particulars",
        category: "Department",
        icon: <FileText size={20} />,
    },
    // temporarily Implementing Agencies into Office
    {
        name: "Office",
        href: "/dashboard/implementing-agencies",
        category: "Cross Department",
        icon: <Building size={20} />,
        isNew: false,
    },
    {
        name: "CMS",
        href: "/dashboard/cms",
        category: "Control Panel",
        icon: <FileEdit size={20} />,
    },
    {
        name: "Settings",
        category: "Control Panel",
        icon: <SettingsIcon size={20} />,
        submenu: [
            {
                name: "User Management",
                href: "/dashboard/settings/user-management",
            },
            {
                name: "Search Admin",
                href: "/admin/search",
            },
            {
                name: "Updates",
                href: "/dashboard/settings/updates",
                submenu: [
                    {
                        name: "Changelogs",
                        href: "/dashboard/settings/updates/changelogs",
                    },
                    {
                        name: "Bugs",
                        href: "/dashboard/settings/updates/bugs-report",
                        badgeComponent: BugsBadge,
                    },
                    {
                        name: "Suggestions",
                        href: "/dashboard/settings/updates/suggestions",
                        badgeComponent: SuggestionsBadge,
                    },
                ],
            },
        ],
    },
];
