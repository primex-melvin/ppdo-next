
interface ProjectLoadingStateProps {
    message?: string;
}

export function ProjectLoadingState({
    message = "Loading projects...",
}: ProjectLoadingStateProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        </div>
    );
}
