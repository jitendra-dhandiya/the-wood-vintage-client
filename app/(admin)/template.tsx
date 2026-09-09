import PageTransition from '../../components/common/PageTransition';

/**
 * A template, not a layout: Next remounts this on every navigation, which is
 * exactly what replays the enter animation. Putting it in the layout would run
 * it once per session and never again.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
