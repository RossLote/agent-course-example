import { useEffect, useEffectEvent } from 'react';
import { boxAfter } from '../../content/index.ts';
import { BoxDiagram } from '../../course/box/BoxDiagram.tsx';
import { Blocks } from '../scene/Blocks.tsx';
import { Copy } from '../scene/Copy.tsx';
import type { ScreenProps } from '../types.ts';
import './Takeaway.css';

/**
 * A module's last screen: the takeaway card and the box with this module's wall and every
 * earlier one solid (the ring from 06; everything on 07), then any end copy. Showing it
 * completes the module, so it reports `takeaway-reached` each time it is shown. It has no
 * heading of its own, so the card is the page's h1.
 */
export function TakeawayScreen({ screen, module, course, progress, onEvent }: ScreenProps<'takeaway'>) {
  const reached = useEffectEvent(() => onEvent({ type: 'takeaway-reached' }));
  useEffect(() => reached(), []);

  return (
    <div className="takeaway">
      <div className="takeaway-row">
        <div className="takeaway-text">
          {screen.eyebrow !== undefined && <p className="eyebrow">{screen.eyebrow}</p>}
          <h1 className="takeaway-card">
            <Copy text={screen.text} />
          </h1>
        </div>
        <div className="takeaway-box">
          <BoxDiagram labels={course.box} {...boxAfter(course.modules, module.slug)} caption={screen.caption} />
        </div>
      </div>
      {screen.end && (
        <div className="takeaway-end">
          <Blocks blocks={screen.end} progress={progress} />
        </div>
      )}
    </div>
  );
}
