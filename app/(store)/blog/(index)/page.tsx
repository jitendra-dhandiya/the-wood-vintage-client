import type { Metadata } from 'next';
import BlogListClient from '../../../../components/blog/BlogListClient';

export const metadata: Metadata = {
  title: 'Fashion Blog — Unique Dressup',
  description: 'Style guides, fashion tips, trend reports and behind-the-scenes stories from Unique Dressup.',
};

export default function BlogPage() {
  return <BlogListClient />;
}
