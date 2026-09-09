import { ListingPageSkeleton } from '../../../components/common/Skeletons';

/**
 * Streamed while this route's data is fetched. Its geometry mirrors the real
 * page, so the content that replaces it does not shift the page under the
 * reader.
 */
export default function SearchLoading() {
  return <ListingPageSkeleton count={12} />;
}
