import { registerRoot, Composition } from 'remotion';
import { Launch } from './Launch.jsx';
import { Airy } from './Airy.jsx';

registerRoot(() => (
  <>
    <Composition id="LaunchWide" component={Launch} durationInFrames={1800} fps={30} width={1920} height={1080} />
    <Composition id="LaunchVertical" component={Launch} durationInFrames={1800} fps={30} width={1080} height={1920} />
    <Composition id="AiryWide" component={Airy} durationInFrames={1800} fps={30} width={1920} height={1080} />
    <Composition id="AiryVertical" component={Airy} durationInFrames={1800} fps={30} width={1080} height={1920} />
  </>
));
