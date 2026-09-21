import { ListingPageSkeleton } from '../../../../../components/common/Skeletons';

// Streamed while the route data is fetched; geometry mirrors the real page (no layout shift).
export default function Loading() {
  return <ListingPageSkeleton />;
}
