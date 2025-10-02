export type Point = {
  x: number;
  y: number;
};

// Represents the three key points of an arm: shoulder, elbow, wrist
export type ArmPose = [Point, Point, Point];

// Represents the three key points of a leg: hip, knee, ankle
export type LegPose = [Point, Point, Point];

// Represents the three points of a single finger: base, middle, tip
export type FingerPose = [Point, Point, Point];

// Represents all five fingers of a hand
export type HandPose = [FingerPose, FingerPose, FingerPose, FingerPose, FingerPose]; // Thumb, Index, Middle, Ring, Pinky

export interface Pose {
  leftArm: ArmPose;
  rightArm: ArmPose;
  leftHand: HandPose;
  rightHand: HandPose;
  leftLeg: LegPose;
  rightLeg: LegPose;
}

export type PoseName = 'IDLE' | 'HI' | 'HEART' | 'FOLD' | 'WAVE_LEFT' | 'THUMBS_UP' | 'POINTING' | 'CUSTOM' | 'RESET' | 'THINKING' | 'EXAMINE_BOARD';