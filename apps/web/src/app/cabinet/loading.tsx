import { Skeleton } from "@paramlab/ui";

export default function CabinetLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="flex flex-col gap-3">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
