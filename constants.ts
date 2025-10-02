
import type { Pose, PoseName, LegPose, HandPose, Point } from './types';

// Base positions for shoulders
const LEFT_SHOULDER = { x: 90, y: 220 };
const RIGHT_SHOULDER = { x: 270, y: 220 };

// Base positions for hips
const LEFT_HIP = { x: 120, y: 440 };
const RIGHT_HIP = { x: 240, y: 440 };

// Default standing leg pose
const STANDING_LEGS: { leftLeg: LegPose; rightLeg: LegPose } = {
  leftLeg: [LEFT_HIP, { x: 110, y: 540 }, { x: 120, y: 640 }],
  rightLeg: [RIGHT_HIP, { x: 250, y: 540 }, { x: 240, y: 640 }],
};

// --- Predefined Hand Poses ---

const IDLE_LEFT_HAND: HandPose = [
  [{x: 60, y: 420}, {x: 55, y: 430}, {x: 50, y: 440}], // Thumb
  [{x: 60, y: 420}, {x: 58, y: 435}, {x: 56, y: 450}], // Index
  [{x: 60, y: 420}, {x: 60, y: 438}, {x: 58, y: 455}], // Middle
  [{x: 60, y: 420}, {x: 62, y: 435}, {x: 60, y: 450}], // Ring
  [{x: 60, y: 420}, {x: 64, y: 432}, {x: 62, y: 445}], // Pinky
];

const IDLE_RIGHT_HAND: HandPose = [
  [{x: 300, y: 420}, {x: 305, y: 430}, {x: 310, y: 440}], // Thumb
  [{x: 300, y: 420}, {x: 302, y: 435}, {x: 304, y: 450}], // Index
  [{x: 300, y: 420}, {x: 300, y: 438}, {x: 302, y: 455}], // Middle
  [{x: 300, y: 420}, {x: 298, y: 435}, {x: 300, y: 450}], // Ring
  [{x: 300, y: 420}, {x: 296, y: 432}, {x: 298, y: 445}], // Pinky
];

const WAVE_HAND: HandPose = [ // For right hand
  [{x: 360, y: 110}, {x: 350, y: 100}, {x: 340, y: 95}],  // Thumb
  [{x: 360, y: 110}, {x: 365, y: 95}, {x: 370, y: 80}],  // Index
  [{x: 360, y: 110}, {x: 370, y: 90}, {x: 375, y: 75}],  // Middle
  [{x: 360, y: 110}, {x: 375, y: 95}, {x: 380, y: 80}],  // Ring
  [{x: 360, y: 110}, {x: 380, y: 100}, {x: 385, y: 90}], // Pinky
];

const WAVE_LEFT_HAND: HandPose = [
    [{x: 0, y: 110}, {x: 10, y: 100}, {x: 20, y: 95}],  // Thumb
    [{x: 0, y: 110}, {x: -5, y: 95}, {x: -10, y: 80}],  // Index
    [{x: 0, y: 110}, {x: -10, y: 90}, {x: -15, y: 75}],  // Middle
    [{x: 0, y: 110}, {x: -15, y: 95}, {x: -20, y: 80}],  // Ring
    [{x: 0, y: 110}, {x: -20, y: 100}, {x: -25, y: 90}], // Pinky
];

const HEART_LEFT_HAND: HandPose = [
    [{x: 180, y: 290}, {x: 160, y: 280}, {x: 150, y: 290}],
    [{x: 180, y: 290}, {x: 165, y: 310}, {x: 160, y: 325}],
    [{x: 180, y: 290}, {x: 175, y: 315}, {x: 170, y: 330}],
    [{x: 180, y: 290}, {x: 185, y: 315}, {x: 180, y: 330}],
    [{x: 180, y: 290}, {x: 190, y: 310}, {x: 185, y: 325}],
];
const HEART_RIGHT_HAND: HandPose = [
    [{x: 180, y: 290}, {x: 200, y: 280}, {x: 210, y: 290}],
    [{x: 180, y: 290}, {x: 195, y: 310}, {x: 200, y: 325}],
    [{x: 180, y: 290}, {x: 185, y: 315}, {x: 190, y: 330}],
    [{x: 180, y: 290}, {x: 175, y: 315}, {x: 180, y: 330}],
    [{x: 180, y: 290}, {x: 170, y: 310}, {x: 175, y: 325}],
];

const FOLD_LEFT_HAND: HandPose = [
    [{x: 250, y: 310}, {x: 240, y: 305}, {x: 230, y: 308}],
    [{x: 250, y: 310}, {x: 260, y: 300}, {x: 255, y: 290}],
    [{x: 250, y: 310}, {x: 265, y: 300}, {x: 260, y: 290}],
    [{x: 250, y: 310}, {x: 270, y: 305}, {x: 265, y: 295}],
    [{x: 250, y: 310}, {x: 270, y: 310}, {x: 268, y: 300}],
];

const FOLD_RIGHT_HAND: HandPose = [
    [{x: 110, y: 340}, {x: 120, y: 335}, {x: 130, y: 338}],
    [{x: 110, y: 340}, {x: 100, y: 330}, {x: 105, y: 320}],
    [{x: 110, y: 340}, {x: 95, y: 330}, {x: 100, y: 320}],
    [{x: 110, y: 340}, {x: 90, y: 335}, {x: 95, y: 325}],
    [{x: 110, y: 340}, {x: 90, y: 340}, {x: 92, y: 330}],
];

const THUMBS_UP_HAND: HandPose = [ // For right hand
    [{x: 290, y: 200}, {x: 295, y: 185}, {x: 300, y: 170}], // Thumb up
    [{x: 290, y: 200}, {x: 275, y: 205}, {x: 270, y: 215}], // Index curled
    [{x: 290, y: 200}, {x: 278, y: 208}, {x: 273, y: 218}], // Middle curled
    [{x: 290, y: 200}, {x: 282, y: 212}, {x: 277, y: 222}], // Ring curled
    [{x: 290, y: 200}, {x: 285, y: 215}, {x: 280, y: 225}], // Pinky curled
];

const POINTING_HAND: HandPose = [ // For right hand
    [{x: 380, y: 250}, {x: 370, y: 240}, {x: 365, y: 230}], // Thumb curled
    [{x: 380, y: 250}, {x: 400, y: 250}, {x: 420, y: 250}], // Index pointing
    [{x: 380, y: 250}, {x: 375, y: 260}, {x: 370, y: 270}], // Middle curled
    [{x: 380, y: 250}, {x: 372, y: 262}, {x: 367, y: 272}], // Ring curled
    [{x: 380, y: 250}, {x: 368, y: 265}, {x: 363, y: 275}], // Pinky curled
];

const THINKING_HAND: HandPose = [ // For right hand, near chin
    [{x: 195, y: 185}, {x: 190, y: 175}, {x: 195, y: 170}], // Thumb
    [{x: 195, y: 185}, {x: 205, y: 188}, {x: 210, y: 195}], // Index
    [{x: 195, y: 185}, {x: 200, y: 192}, {x: 205, y: 200}], // Middle
    [{x: 195, y: 185}, {x: 195, y: 195}, {x: 198, y: 205}], // Ring
    [{x: 195, y: 185}, {x: 190, y: 195}, {x: 192, y: 202}], // Pinky
];

const CHALK_HAND: HandPose = [ // For right hand, like pointing but holding chalk
    [{x: 400, y: 250}, {x: 395, y: 245}, {x: 390, y: 240}], // Thumb
    [{x: 400, y: 250}, {x: 405, y: 245}, {x: 400, y: 240}], // Index (pinched with thumb)
    [{x: 400, y: 250}, {x: 395, y: 260}, {x: 390, y: 270}], // Middle curled
    [{x: 400, y: 250}, {x: 392, y: 262}, {x: 387, y: 272}], // Ring curled
    [{x: 400, y: 250}, {x: 388, y: 265}, {x: 383, y: 275}], // Pinky curled
];

const HOLD_BOOK_HAND: HandPose = [ // For left hand
    [{x: 150, y: 350}, {x: 160, y: 345}, {x: 170, y: 350}], // Thumb holding top of book
    [{x: 150, y: 350}, {x: 145, y: 365}, {x: 140, y: 375}], // Index curled
    [{x: 150, y: 350}, {x: 150, y: 368}, {x: 145, y: 380}], // Middle curled
    [{x: 150, y: 350}, {x: 155, y: 365}, {x: 150, y: 375}], // Ring curled
    [{x: 150, y: 350}, {x: 160, y: 362}, {x: 158, y: 372}], // Pinky curled
];


export const POSES: Record<Exclude<PoseName, 'CUSTOM' | 'RESET'>, Pose> = {
  IDLE: {
    leftArm: [LEFT_SHOULDER, { x: 70, y: 320 }, { x: 60, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 290, y: 320 }, { x: 300, y: 420 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: IDLE_RIGHT_HAND,
    ...STANDING_LEGS,
  },
  HI: {
    leftArm: [LEFT_SHOULDER, { x: 70, y: 320 }, { x: 60, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 330, y: 180 }, { x: 360, y: 110 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: WAVE_HAND,
    ...STANDING_LEGS,
  },
  WAVE_LEFT: {
    leftArm: [LEFT_SHOULDER, { x: 30, y: 180 }, { x: 0, y: 110 }],
    rightArm: [RIGHT_SHOULDER, { x: 290, y: 320 }, { x: 300, y: 420 }],
    leftHand: WAVE_LEFT_HAND,
    rightHand: IDLE_RIGHT_HAND,
    ...STANDING_LEGS,
  },
  HEART: {
    leftArm: [LEFT_SHOULDER, { x: 130, y: 250 }, { x: 180, y: 290 }],
    rightArm: [RIGHT_SHOULDER, { x: 230, y: 250 }, { x: 180, y: 290 }],
    leftHand: HEART_LEFT_HAND,
    rightHand: HEART_RIGHT_HAND,
    ...STANDING_LEGS,
  },
  FOLD: {
    leftArm: [LEFT_SHOULDER, { x: 150, y: 280 }, { x: 250, y: 310 }],
    rightArm: [RIGHT_SHOULDER, { x: 210, y: 310 }, { x: 110, y: 340 }],
    leftHand: FOLD_LEFT_HAND,
    rightHand: FOLD_RIGHT_HAND,
    ...STANDING_LEGS,
  },
  THUMBS_UP: {
    leftArm: [LEFT_SHOULDER, { x: 70, y: 320 }, { x: 60, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 280, y: 250 }, { x: 290, y: 200 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: THUMBS_UP_HAND,
    ...STANDING_LEGS,
  },
  POINTING: {
    leftArm: [LEFT_SHOULDER, { x: 70, y: 320 }, { x: 60, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 320, y: 250 }, { x: 380, y: 250 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: POINTING_HAND,
    ...STANDING_LEGS,
  },
  THINKING: {
    leftArm: [LEFT_SHOULDER, { x: 70, y: 320 }, { x: 60, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 220, y: 210 }, { x: 195, y: 185 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: THINKING_HAND,
    ...STANDING_LEGS,
  },
  EXAMINE_BOARD: {
    leftArm: [LEFT_SHOULDER, { x: 120, y: 280 }, { x: 150, y: 350 }],
    rightArm: [RIGHT_SHOULDER, { x: 330, y: 250 }, { x: 400, y: 250 }],
    leftHand: HOLD_BOOK_HAND,
    rightHand: CHALK_HAND,
    ...STANDING_LEGS,
  },
};

// A more realistic 4-frame walk cycle.
export const WALK_CYCLE: Pose[] = [
  // Frame 1: Right leg forward (contact), left arm forward. Body slightly lower.
  {
    leftArm: [LEFT_SHOULDER, { x: 85, y: 325 }, { x: 80, y: 430 }],
    rightArm: [RIGHT_SHOULDER, { x: 275, y: 315 }, { x: 280, y: 410 }],
    leftLeg: [{...LEFT_HIP, y: 442}, { x: 115, y: 540 }, { x: 110, y: 638 }],
    rightLeg: [{...RIGHT_HIP, y: 442}, { x: 255, y: 545 }, { x: 265, y: 645 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: IDLE_RIGHT_HAND,
  },
  // Frame 2: Passing pose. Body is at its highest point. Left leg passing.
  {
    leftArm: [LEFT_SHOULDER, { x: 75, y: 320 }, { x: 65, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 285, y: 320 }, { x: 295, y: 420 }],
    leftLeg: [{...LEFT_HIP, y: 438}, { x: 125, y: 535 }, { x: 140, y: 620 }], // Knee bent, foot up
    rightLeg: [{...RIGHT_HIP, y: 438}, { x: 250, y: 540 }, { x: 240, y: 640 }], // Supporting leg
    leftHand: IDLE_LEFT_HAND,
    rightHand: IDLE_RIGHT_HAND,
  },
  // Frame 3: Left leg forward (contact), right arm forward. Body slightly lower.
  {
    leftArm: [LEFT_SHOULDER, { x: 75, y: 315 }, { x: 70, y: 410 }],
    rightArm: [RIGHT_SHOULDER, { x: 285, y: 325 }, { x: 290, y: 430 }],
    leftLeg: [{...LEFT_HIP, y: 442}, { x: 115, y: 545 }, { x: 125, y: 645 }],
    rightLeg: [{...RIGHT_HIP, y: 442}, { x: 245, y: 540 }, { x: 240, y: 638 }],
    leftHand: IDLE_LEFT_HAND,
    rightHand: IDLE_RIGHT_HAND,
  },
  // Frame 4: Passing pose. Body is at its highest point. Right leg passing.
  {
    leftArm: [LEFT_SHOULDER, { x: 75, y: 320 }, { x: 65, y: 420 }],
    rightArm: [RIGHT_SHOULDER, { x: 285, y: 320 }, { x: 295, y: 420 }],
    leftLeg: [{...LEFT_HIP, y: 438}, { x: 110, y: 540 }, { x: 120, y: 640 }], // Supporting leg
    rightLeg: [{...RIGHT_HIP, y: 438}, { x: 235, y: 535 }, { x: 250, y: 620 }], // Knee bent, foot up
    leftHand: IDLE_LEFT_HAND,
    rightHand: IDLE_RIGHT_HAND,
  },
];
