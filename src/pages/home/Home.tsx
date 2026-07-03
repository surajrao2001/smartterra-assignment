import { HomeHeader } from '../../components/home/HomeHeader';
import { HomeCard } from '../../components/home/HomeCard';

export function Home() {
  return (
    <div>
      <HomeHeader />
      <main className="p-4 space-y-4">
        <HomeCard title="Welcome">Dummy content for the first card.</HomeCard>
        <HomeCard title="Info">Dummy content for the second card.</HomeCard>
      </main>
    </div>
  );
}