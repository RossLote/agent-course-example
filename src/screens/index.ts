// The screen registry: the component that renders each screen type. The frame
// (src/course/frame/) looks a screen up here by its `type`.
//
// The pattern every screen type follows:
// - It lives in src/screens/<type>/index.tsx and exports one component, `<Type>Screen`, that
//   takes `ScreenProps<'<type>'>` (src/screens/types.ts): its content, its saved answer, the
//   module's progress, and `onEvent`, its only way to report anything. Other files it needs
//   (styles, parts, tests) go in the same folder.
// - It renders its body only. The frame renders the eyebrow, the heading as the page's h1,
//   the intro and the `side` column, and the Back and Next buttons.
// - Blocks and copy render with `Blocks` (src/screens/scene/Blocks.tsx) and `Copy`
//   (src/screens/scene/Copy.tsx).
// - What more than one screen draws or does lives in src/screens/parts/: the right-or-wrong
//   `Mark` and `ToneIcon`, the `CheckButton`, the `Announce` status line and live region, the
//   pointer drag and its `DragGhost`, `useFocusAfterRender`, and the `Quote` the home page
//   shares. A saved answer is read back with
//   src/screens/saved.ts.
// - With `saved`, it renders itself answered, with its feedback shown.
// A screen bead replaces its own folder and never edits this file: the names here are fixed.
import type { ComponentType } from 'react';
import type { ScreenType } from '../content/index.ts';
import { BriefScreen } from './brief/index.tsx';
import { ChatScreen } from './chat/index.tsx';
import { ChooseScreen } from './choose/index.tsx';
import { CompareScreen } from './compare/index.tsx';
import { FridgeScreen } from './fridge/index.tsx';
import { MatchScreen } from './match/index.tsx';
import { OrderScreen } from './order/index.tsx';
import { SceneScreen } from './scene/index.tsx';
import { TakeawayScreen } from './takeaway/index.tsx';
import type { ScreenProps } from './types.ts';

/** Every screen type's component; the type makes sure none is missing. */
export const screenComponents: { readonly [T in ScreenType]: ComponentType<ScreenProps<T>> } = {
  scene: SceneScreen,
  takeaway: TakeawayScreen,
  chat: ChatScreen,
  brief: BriefScreen,
  choose: ChooseScreen,
  match: MatchScreen,
  order: OrderScreen,
  fridge: FridgeScreen,
  compare: CompareScreen,
};
