export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="flex items-center gap-2 text-xs text-[#555555]">
        <div className="w-4 h-4 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin" />
        <span>Loading ResumeCraft Studio...</span>
      </div>
    </div>
  );
}
