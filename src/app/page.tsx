import DynamicRumblePlayer from './components/DynamicRumblePlayer';
import TippingDashboard from './components/TippingDashboard';


export default function Home() {
  const videoUrl = "https://rumble.com/v60552h-newsmax2-live-real-news-for-real-people.html";
  
  return (
    <TippingDashboard videoUrl={videoUrl}>
      <DynamicRumblePlayer videoUrl={videoUrl} />
    </TippingDashboard>
  );
}
