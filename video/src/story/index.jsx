import { registerRoot, Composition } from 'remotion';
import { Story1, Story2, Story3, story1Len, story2Len, story3Len } from './Stories.jsx';
import { Deadline, deadlineLen } from './Deadline.jsx';
import { Merge, mergeLen } from './Merge.jsx';
import { Resume, resumeLen } from './Resume.jsx';
import { Doodle, doodleLen } from './Doodle.jsx';

const common = { fps: 30, width: 1080, height: 1920 };
const frames = (len) => Math.round(len * 30);
registerRoot(() => (
  <>
    <Composition id="Deadline" component={Deadline} durationInFrames={frames(deadlineLen())} {...common} />
    <Composition id="Merge" component={Merge} durationInFrames={frames(mergeLen())} {...common} />
    <Composition id="Resume" component={Resume} durationInFrames={frames(resumeLen())} {...common} />
    <Composition id="Doodle" component={Doodle} durationInFrames={frames(doodleLen())} {...common} />
    <Composition id="Story1" component={Story1} durationInFrames={frames(story1Len())} {...common} />
    <Composition id="Story2" component={Story2} durationInFrames={frames(story2Len())} {...common} />
    <Composition id="Story3" component={Story3} durationInFrames={frames(story3Len())} {...common} />
  </>
));
