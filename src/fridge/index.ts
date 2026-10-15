// The fridge activity (D17): one component driven by a fridge file. Screens import from here.
export { Fridge, type FridgeProps } from './Fridge.tsx';
export { fridgeReducer, isFinished, newPlay, playFromSaved, savedPlay, scoreOf, type FridgeAction, type FridgeOutcome, type FridgePlay } from './play.ts';
export { fridgeWords } from './words.ts';
