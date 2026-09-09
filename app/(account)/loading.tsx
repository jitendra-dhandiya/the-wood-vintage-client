import { AdminPageSkeleton } from '../../components/common/Skeletons';

/**
 * Streamed while this route's data is fetched. Its geometry mirrors the real
 * page, so the content that replaces it does not shift the page under the
 * reader.
 */
export default function AccountLoading() {
  return <AdminPageSkeleton rows={4} />;
}
