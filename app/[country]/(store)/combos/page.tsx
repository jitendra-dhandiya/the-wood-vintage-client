import type { Metadata } from 'next';
import ComboListClient from '../../../../components/combo/ComboListClient';
import { SITE_URL } from '@/constants';
import { withCountry } from '../../../../lib/withCountry';

interface Props { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  return {
    title: 'Combo Offers',
    description: 'Handpicked sets of handcrafted wooden pieces, priced together for less than buying them one by one.',
    alternates: { canonical: `${SITE_URL}${withCountry('/combos', country)}` },
  };
}

export default function CombosPage() {
  return <ComboListClient />;
}
