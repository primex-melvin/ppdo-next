//app\dashboard\settings\components\BadgeBubble.tsx

export default function BadgeBubble({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="absolute -top-2 -right-3 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
      {count}
    </span>
  );
}
