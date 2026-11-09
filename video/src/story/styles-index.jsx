import { registerRoot, Still } from 'remotion';
import { Collage, Kinetic, Doodle, Macro } from './styles.jsx';

const c = { width: 1080, height: 1920 };
registerRoot(() => (
  <>
    <Still id="Collage" component={Collage} {...c} />
    <Still id="Kinetic" component={Kinetic} {...c} />
    <Still id="Doodle" component={Doodle} {...c} />
    <Still id="Macro" component={Macro} {...c} />
  </>
));
