import { covenanterRune } from '../runes/covenanter-rune';
import { semanticistRune } from '../runes/semanticist-rune';
import { aestheticRune } from '../runes/aesthetic-rune';
import { tracerRune } from '../runes/tracer-rune';
import { validatorRune } from '../runes/validator-rune';
import { runeScrivenerRune } from '../runes/ncbdb-engrave-rune';
import { dispatcherRune } from '../runes/dispatcher-rune';
import { telepathRune } from '../runes/telepath-rune';
import { alchemistRune } from '../runes/alchemist-rune';
import { engraverRune } from '../runes/engraver-rune';

import { opticalRendererRune } from '../runes/optical-renderer-rune';
import { semanticAlchemyRune } from '../runes/semantic-alchemy-rune';
import { visualPerceptorRune } from '../runes/visual-perceptor-rune';
import { creativeResonatorRune } from '../runes/creative-resonance-rune';
import { intuitionDesignerRune } from '../runes/interaction-intuition-rune';
import { hallucinationSlayerRune } from '../runes/hallucination-verification-rune';
import { emotionSensorRune } from '../runes/emotion-sensor-rune';
import { dataVisualizerRune } from '../runes/data-visualizer-rune';
import { creativeGenesisRune } from '../runes/creative-genesis-rune';
import { perceptionIntegratorRune } from '../runes/perception-integrator-rune';

export const APOSTLE_RUNE_MAP: Record<string, any> = {
  // Ten Wings
  "R1": covenanterRune,
  "R2": semanticistRune,
  "R3": aestheticRune,
  "R4": tracerRune,
  "R5": validatorRune,
  "R6": runeScrivenerRune,
  "R7": dispatcherRune,
  "R8": telepathRune,
  "R9": alchemistRune,
  "R10": engraverRune,

  // ARVO Wings
  "A1": opticalRendererRune,
  "A2": semanticAlchemyRune,
  "A3": visualPerceptorRune,
  "A4": creativeResonatorRune,
  "A5": intuitionDesignerRune,
  "A6": hallucinationSlayerRune,
  "A7": emotionSensorRune,
  "A8": dataVisualizerRune,
  "A9": creativeGenesisRune,
  "A10": perceptionIntegratorRune,
};
