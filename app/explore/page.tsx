import { Suspense } from "react";
import { ExploreScreen } from "@/components/screens/ExploreScreen";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="screen" />}>
      <ExploreScreen />
    </Suspense>
  );
}
