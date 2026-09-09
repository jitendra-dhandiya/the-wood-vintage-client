import AdminLayoutClient from '../../components/admin/AdminLayoutClient';
import AuthInitializer from '../../components/common/AuthInitializer';
import ImageCropperProvider from '../../components/common/ImageCropperProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {/* Every admin image picker opens the crop dialog from here, so the
          dialog exists once for the whole panel rather than per page. */}
      <ImageCropperProvider>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </ImageCropperProvider>
    </>
  );
}
