import { useId } from 'react';
import { Fridge } from '../../fridge/index.ts';
import { Copy } from '../scene/Copy.tsx';
import type { ScreenProps } from '../types.ts';
import './Compare.css';

/**
 * The compare screen (M05-TwoFridges): the two fridges its file names, side by side and each
 * playable as its own file says, then the table of what is different and which wall made the
 * difference. Each fridge keeps its own play, name and saved answer, so each reports its own
 * `fridge-ended`.
 */
export function CompareScreen({ screen, course, progress, onEvent }: ScreenProps<'compare'>) {
  const heading = useId();
  const [left, right] = [screen.left, screen.right].map((name) => ({ name, fridge: course.fridges[name] }));

  return (
    <div className="compare">
      <div className="compare-fridges">
        {[left, right].map(({ name, fridge }) => (
          <Fridge key={name} fridge={fridge} name={name} saved={progress.items[name]?.answer} onEvent={onEvent} />
        ))}
      </div>

      <section className="compare-table-card" aria-labelledby={heading}>
        {screen.table.heading !== undefined && (
          <h2 id={heading} className="eyebrow">
            <Copy text={screen.table.heading} />
          </h2>
        )}
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Aspect</th>
              <th scope="col">
                <Copy text={left.fridge.title} />
              </th>
              <th scope="col">
                <Copy text={right.fridge.title} />
              </th>
              <th scope="col">Wall</th>
            </tr>
          </thead>
          <tbody>
            {screen.table.rows.map((row) => (
              <tr key={row.aspect}>
                <th scope="row">
                  <Copy text={row.aspect} />
                </th>
                <td>
                  <Copy text={row.left} />
                </td>
                <td>
                  <Copy text={row.right} />
                </td>
                <td className="compare-wall">
                  <Copy text={row.wall} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
