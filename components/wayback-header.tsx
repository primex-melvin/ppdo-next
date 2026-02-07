import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

export function WaybackHeader() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8 w-full justify-center">
        <Button className="bg-[#0099ab] hover:bg-[#007a8a] text-white font-bold rounded-sm px-6 py-2 h-auto text-lg uppercase tracking-tight">
          Donate
        </Button>

        <div className="flex flex-col items-center leading-none">
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Internet Archive</span>
          <h1 className="text-5xl font-bold tracking-tighter flex items-center">
            <span className="text-[#333]">WayBack</span>
            <span className="text-[#cc0000] italic font-serif ml-1">Machine</span>
          </h1>
        </div>

        <div className="flex-1 max-w-xl relative">
          <p className="text-sm text-gray-600 mb-2 text-center">
            Explore more than 1 trillion{" "}
            <span className="text-[#0645ad] cursor-pointer hover:underline">web pages</span> saved over time
          </p>
          <div className="relative">
            <Input
              defaultValue="google.com"
              className="h-12 border-[#ccc] rounded-sm pr-10 text-lg shadow-inner focus-visible:ring-0 focus-visible:border-gray-400"
            />
            <X className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
