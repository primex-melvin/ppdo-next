import Link from "next/link"
import { Agency } from "../types/agency-table.types"

interface AgencyGalleryProps {
    agencies: Agency[]
}

export function AgencyGallery({ agencies }: AgencyGalleryProps) {
    if (agencies.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    No agencies found
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in zoom-in-95 duration-300">
            {agencies.map((agency) => (
                <div
                    key={agency._id}
                    className="group flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer"
                >
                    {/* Folder Icon - Windows Style (Reused from Office Page) */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                        <svg
                            className="w-full h-full drop-shadow-md"
                            viewBox="0 0 64 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Shadow */}
                            <path
                                d="M12 48C10.3431 48 9 46.6569 9 45V16C9 14.3431 10.3431 13 12 13H26L28 17H52C53.6569 17 55 18.3431 55 20V45C55 46.6569 53.6569 48 52 48H12Z"
                                className="fill-black/10 translate-x-0.5 translate-y-0.5"
                            />
                            {/* Folder body - main yellow */}
                            <path
                                d="M8 44C8 45.6569 9.34315 47 11 47H50C51.6569 47 53 45.6569 53 44V19C53 17.3431 51.6569 16 50 16H26L24 12H11C9.34315 12 8 13.3431 8 15V44Z"
                                className="fill-yellow-400 dark:fill-yellow-500 group-hover:fill-yellow-500 dark:group-hover:fill-yellow-400 transition-colors"
                            />
                            {/* Folder tab - lighter yellow */}
                            <path
                                d="M8 15C8 13.3431 9.34315 12 11 12H26L28 16H50C51.6569 16 53 17.3431 53 19V21H8V15Z"
                                className="fill-yellow-300 dark:fill-yellow-600 group-hover:fill-yellow-400 dark:group-hover:fill-yellow-500 transition-colors"
                            />
                            {/* Top highlight */}
                            <path
                                d="M11 12H26L28 16H50C51.6569 16 53 17.3431 53 19V20H8V15C8 13.3431 9.34315 12 11 12Z"
                                className="fill-white/30"
                            />
                            {/* Left edge highlight */}
                            <path
                                d="M8 15V44C8 45.6569 9.34315 47 11 47H12V15C12 13.3431 10.6569 12 9 12H8V15Z"
                                className="fill-white/20"
                            />
                            {/* Bottom shadow */}
                            <path
                                d="M11 46H50C51.6569 46 53 44.6569 53 43V44C53 45.6569 51.6569 47 50 47H11C9.34315 47 8 45.6569 8 44V43C8 44.6569 9.34315 46 11 46Z"
                                className="fill-black/15"
                            />
                        </svg>
                    </div>

                    {/* Agency Name */}
                    <div className="w-full text-center">
                        <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                            {agency.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {agency.code}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
