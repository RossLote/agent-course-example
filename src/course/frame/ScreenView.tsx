import type { ComponentType } from 'react';
import type { ScreenType } from '../../content/index.ts';
import { screenComponents } from '../../screens/index.ts';
import type { ScreenProps } from '../../screens/types.ts';

/** Renders a screen with its type's component from the registry (src/screens/index.ts). */
export function ScreenView(props: ScreenProps<ScreenType>) {
  // The registry pairs each type with its component, which TypeScript cannot follow through an
  // index by a union, so the lookup is widened here, once.
  const Component = screenComponents[props.screen.type] as ComponentType<ScreenProps<ScreenType>>;
  return <Component {...props} />;
}
