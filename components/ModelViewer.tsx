import React, { MouseEvent, useMemo, useRef, useLayoutEffect, useState } from 'react';
import type { Pose, ArmPose, LegPose, HandPose, FingerPose, Point, PoseName } from '../types';

// Type definitions for draggable points, consistent with App.tsx
type DraggedLimbPointInfo = {
  type: 'limb';
  limb: 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
  pointIndex: 1 | 2;
};
type DraggedFingerPointInfo = {
    type: 'finger';
    hand: 'leftHand' | 'rightHand';
    fingerIndex: number;
    pointIndex: 1 | 2;
};
type DraggedPointInfo = DraggedLimbPointInfo | DraggedFingerPointInfo;
type FacialExpression = 'neutral' | 'happy' | 'sad';

// Helper function to create a tapered limb segment as a filled path
const createLimbPath = (p1: Point, p2: Point, startWidth: number, endWidth: number): string => {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const perpAngle = angle + Math.PI / 2;

    const halfStart = startWidth / 2;
    const halfEnd = endWidth / 2;

    const x1a = p1.x + Math.cos(perpAngle) * halfStart;
    const y1a = p1.y + Math.sin(perpAngle) * halfStart;
    const x1b = p1.x - Math.cos(perpAngle) * halfStart;
    const y1b = p1.y - Math.sin(perpAngle) * halfStart;

    const x2a = p2.x + Math.cos(perpAngle) * halfEnd;
    const y2a = p2.y + Math.sin(perpAngle) * halfEnd;
    const x2b = p2.x - Math.cos(perpAngle) * halfEnd;
    const y2b = p2.y - Math.sin(perpAngle) * halfEnd;

    return `M ${x1a} ${y1a} L ${x2a} ${y2a} L ${x2b} ${y2b} L ${x1b} ${y1b} Z`;
};


type DraggablePointProps = {
    point: Point;
    dragInfo: DraggedPointInfo;
    isDragging: boolean;
    onDragStart: (info: DraggedPointInfo) => void;
    radius?: number;
};

const DraggablePoint: React.FC<DraggablePointProps> = React.memo(({ point, dragInfo, isDragging, onDragStart, radius = 12 }) => {
    const handleMouseDown = (e: MouseEvent) => {
        onDragStart(dragInfo);
    };
    const transitionClass = isDragging ? '' : 'transition-all duration-500 ease-in-out';
    return (
        <circle
            cx={point.x}
            cy={point.y}
            r={radius}
            className={`fill-cyan-400/20 stroke-cyan-300 stroke-2 cursor-grab active:cursor-grabbing transition-opacity duration-200 opacity-25 hover:opacity-100 ${transitionClass}`}
            onMouseDown={handleMouseDown}
        />
    );
});
DraggablePoint.displayName = 'DraggablePoint';


interface ModelViewerProps {
  pose: Pose;
  activePose: PoseName;
  isDragging: boolean;
  boardText: string;
  imageUrl: string | null;
  xOffset: number;
  scale: number;
  scrollSpeed: number;
  facingDirection: 'left' | 'right';
  mouthShape: 'closed' | 'open';
  facialExpression: FacialExpression;
  onDragStart: (info: DraggedPointInfo) => void;
  onDrag: (event: MouseEvent<SVGSVGElement>) => void;
  onDragEnd: () => void;
}

const Finger: React.FC<{ 
    fingerPose: FingerPose; 
    strokeColor: string; 
    isDragging: boolean;
    hand: 'leftHand' | 'rightHand';
    fingerIndex: number;
    onDragStart: (info: DraggedPointInfo) => void;
}> = React.memo(({ fingerPose, strokeColor, isDragging, hand, fingerIndex, onDragStart }) => {
  const [base, middle, tip] = fingerPose;
  const transitionClass = isDragging ? '' : 'transition-all duration-500 ease-in-out';
  return (
    <g>
        <polyline
            points={`${base.x},${base.y} ${middle.x},${middle.y} ${tip.x},${tip.y}`}
            className={`fill-none ${strokeColor} ${transitionClass} pointer-events-none`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <DraggablePoint
            point={middle}
            onDragStart={onDragStart}
            dragInfo={{ type: 'finger', hand, fingerIndex, pointIndex: 1 }}
            isDragging={isDragging}
            radius={8}
        />
        <DraggablePoint
            point={tip}
            onDragStart={onDragStart}
            dragInfo={{ type: 'finger', hand, fingerIndex, pointIndex: 2 }}
            isDragging={isDragging}
            radius={8}
        />
    </g>
  );
});
Finger.displayName = 'Finger';

const Hand: React.FC<{ 
    handPose: HandPose; 
    strokeColor: string; 
    isDragging: boolean;
    hand: 'leftHand' | 'rightHand';
    onDragStart: (info: DraggedPointInfo) => void;
}> = React.memo(({ handPose, strokeColor, isDragging, hand, onDragStart }) => {
  const wrist = handPose[0][0];
  const transitionClass = isDragging ? '' : 'transition-all duration-500 ease-in-out';

  const palmD = `M ${wrist.x - 14},${wrist.y + 4} C ${wrist.x - 16},${wrist.y + 18} ${wrist.x + 16},${wrist.y + 18} ${wrist.x + 14},${wrist.y + 4} L ${wrist.x},${wrist.y - 8} Z`;

  return (
    <g>
      <path d={palmD} className={`fill-[#D2B48C] stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1" />
      {handPose.map((finger, index) => (
        <Finger 
            key={index} 
            fingerPose={finger} 
            strokeColor={strokeColor} 
            isDragging={isDragging}
            hand={hand}
            fingerIndex={index}
            onDragStart={onDragStart}
        />
      ))}
    </g>
  )
});
Hand.displayName = 'Hand';

const Arm: React.FC<{ armPose: ArmPose; onDragStart: ModelViewerProps['onDragStart']; limb: 'leftArm' | 'rightArm', isDragging: boolean }> = React.memo(({ armPose, onDragStart, limb, isDragging }) => {
  const [shoulder, elbow, wrist] = armPose;
  const shirtColor = 'fill-slate-200'; // Light blue collared shirt
  const skinColor = 'fill-[#D2B48C]';
  const transitionClass = isDragging ? '' : 'transition-all duration-500 ease-in-out';

  const upperArmPath = createLimbPath(shoulder, elbow, 36, 22);
  const lowerArmPath = createLimbPath(elbow, wrist, 22, 18);

  return (
    <g>
      <path d={upperArmPath} className={`${shirtColor} stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1" />
      <path d={lowerArmPath} className={`${skinColor} stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1" />
      
      <circle cx={shoulder.x} cy={shoulder.y} r="18" className={`${shirtColor} pointer-events-none ${transitionClass}`} />
      <circle cx={elbow.x} cy={elbow.y} r="11" className={`${skinColor} stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1"/>
      
      <DraggablePoint point={elbow} onDragStart={onDragStart} dragInfo={{ type: 'limb', limb, pointIndex: 1 }} isDragging={isDragging} />
      <DraggablePoint point={wrist} onDragStart={onDragStart} dragInfo={{ type: 'limb', limb, pointIndex: 2 }} isDragging={isDragging} />
    </g>
  );
});
Arm.displayName = 'Arm';

const Leg: React.FC<{ legPose: LegPose; onDragStart: ModelViewerProps['onDragStart']; limb: 'leftLeg' | 'rightLeg', isDragging: boolean }> = React.memo(({ legPose, onDragStart, limb, isDragging }) => {
    const [hip, knee, ankle] = legPose;
    const pantsColor = 'fill-[#6d4c41]'; // Brown trousers
    const shoeColor = 'fill-[#4a3728]';
    const transitionClass = isDragging ? '' : 'transition-all duration-500 ease-in-out';

    const upperLegPath = createLimbPath(hip, knee, 46, 36);
    const lowerLegPath = createLimbPath(knee, ankle, 36, 25);
    
    const legAngle = Math.atan2(ankle.y - knee.y, ankle.x - knee.x) * (180 / Math.PI);
    const footAngle = legAngle + (limb === 'leftLeg' ? -100 : -80);

    return (
        <g>
            <path d={upperLegPath} className={`${pantsColor} stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1" />
            <path d={lowerLegPath} className={`${pantsColor} stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1" />
            <circle cx={hip.x} cy={hip.y} r="23" className={`${pantsColor} pointer-events-none ${transitionClass}`} />
            <circle cx={knee.x} cy={knee.y} r="18" className={`${pantsColor} stroke-slate-600 pointer-events-none ${transitionClass}`} strokeWidth="1" />
            
            <path 
                d="M -15,5 C -20,-20 20,-20 25,5 Q 10,15 -15,5 Z" 
                transform={`translate(${ankle.x}, ${ankle.y}) rotate(${footAngle})`}
                className={`${shoeColor} stroke-slate-800 stroke-1 pointer-events-none ${transitionClass}`}
            />
            
            <DraggablePoint point={knee} onDragStart={onDragStart} dragInfo={{ type: 'limb', limb, pointIndex: 1 }} isDragging={isDragging} />
            <DraggablePoint point={ankle} onDragStart={onDragStart} dragInfo={{ type: 'limb', limb, pointIndex: 2 }} isDragging={isDragging} />
        </g>
    );
});
Leg.displayName = 'Leg';


const ModelViewer: React.FC<ModelViewerProps> = ({ pose, activePose, boardText, imageUrl, isDragging, xOffset, scale, scrollSpeed, facingDirection, mouthShape, facialExpression, onDragStart, onDrag, onDragEnd }) => {
  const skinTone = '#D2B48C';
  const transitionClassBody = isDragging ? '' : 'transition-all duration-500 ease-in-out';
  
  const characterCenterX = 180; 

  const transform = `
    translate(${xOffset}, 0)
    scale(${scale})
    translate(${characterCenterX}, 0)
    scale(${facingDirection === 'left' ? -1 : 1}, 1)
    translate(-${characterCenterX}, 0)
  `;

  const { leftLeg, rightLeg } = pose;
  const leftAnkle = leftLeg[2];
  const rightAnkle = rightLeg[2];

  const shadowCx = (leftAnkle.x + rightAnkle.x) / 2;
  const shadowCy = Math.max(leftAnkle.y, rightAnkle.y) + 5;
  const feetDistance = Math.abs(leftAnkle.x - rightAnkle.x);
  const baseFeetDistance = 120;
  const shadowRx = Math.max(30, 60 + (feetDistance - baseFeetDistance) * 0.2); 
  const shadowRy = 10;

  // --- Board Text Logic ---
  const textRef = useRef<SVGTextElement>(null);
  const [animationStyle, setAnimationStyle] = useState({});

  const wrappedLines = useMemo(() => {
    const maxCharsPerLine = 30;
    const lines = boardText.split('\n');
    const result: string[] = [];

    lines.forEach(line => {
      if (line.length <= maxCharsPerLine) {
        result.push(line);
        return;
      }
      
      let currentLine = '';
      const words = line.split(' ');
      for (const word of words) {
        if (word.length > maxCharsPerLine && currentLine.length === 0) {
            result.push(word);
            continue;
        }

        const potentialLength = currentLine.length + (currentLine ? 1 : 0) + word.length;
        if (potentialLength > maxCharsPerLine) {
          result.push(currentLine);
          currentLine = word;
        } else {
          currentLine += (currentLine ? ' ' : '') + word;
        }
      }
      if (currentLine) {
        result.push(currentLine.trim());
      }
    });

    return result;
  }, [boardText]);

  useLayoutEffect(() => {
    if (textRef.current) {
        const textHeight = textRef.current.getBBox().height;
        const boardHeight = 570; // Inner height of the board
        if (textHeight > boardHeight) {
            const totalDistance = textHeight + boardHeight;

            const numberOfLines = wrappedLines.length;
            const baseSpeed = 12; 
            const reductionPerTenLines = 1;
            const minSpeed = 10; 
            const pixelsPerSecond = Math.max(minSpeed, baseSpeed - (Math.floor(numberOfLines / 10) * reductionPerTenLines));
            
            const baseDuration = totalDistance / pixelsPerSecond;
            const duration = Math.max(0.1, baseDuration / scrollSpeed);

            setAnimationStyle({
                '--scroll-start': `${boardHeight + 20}px`, 
                '--scroll-end': `-${textHeight}px`,
                animationDuration: `${duration}s`,
            });
        } else {
            setAnimationStyle({});
        }
    }
}, [wrappedLines, scrollSpeed]);

  const mouthPath = useMemo(() => {
    if (mouthShape === 'open') {
      return "M 175 173 C 178 180, 182 180, 185 173";
    }
    switch (facialExpression) {
      case 'happy':
        return "M 172 175 Q 180 182, 188 175";
      case 'sad':
        return "M 172 175 Q 180 168, 188 175";
      case 'neutral':
      default:
        return "M 172 175 L 188 175";
    }
  }, [mouthShape, facialExpression]);

  const eyebrowPaths = useMemo(() => {
    switch (facialExpression) {
      case 'happy':
        return {
          left: "M 145 115 Q 155 110 165 115",
          right: "M 195 115 Q 205 110 215 115"
        };
      case 'sad':
        return {
          left: "M 145 118 Q 155 123 165 118",
          right: "M 195 118 Q 205 123 215 118"
        };
      case 'neutral':
      default:
        return {
          left: "M 145 115 Q 155 112 165 115",
          right: "M 195 115 Q 205 112 215 115"
        };
    }
  }, [facialExpression]);

  return (
    <svg 
      viewBox="0 0 1200 700" 
      className="w-full h-full"
      onMouseMove={onDrag}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
    >
      <defs>
        <clipPath id="board-clip">
            <rect x="790" y="65" width="370" height="570" rx="5" />
        </clipPath>
         <clipPath id="image-board-clip">
            <rect x="40" y="65" width="370" height="470" rx="5" />
        </clipPath>
        <radialGradient id="grad-head" cx="50%" cy="40%" r="50%">
          <stop offset="0%" style={{stopColor: '#e0c29e', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: skinTone, stopOpacity: 1}} />
        </radialGradient>
        <linearGradient id="floor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#8a6a4a'}} />
            <stop offset="100%" style={{stopColor: '#71543a'}} />
        </linearGradient>
         <radialGradient id="shadow-grad">
          <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Classroom Background */}
      <rect x="0" y="0" width="1200" height="630" fill="#dbeafe" />
      <rect x="0" y="630" width="1200" height="15" fill="#a1887f" />
      <rect x="0" y="645" width="1200" height="55" fill="url(#floor-grad)" />

      {/* Left Image Board */}
      <rect x="25" y="50" width="400" height="500" rx="15" fill="#4b5563" />
      <rect x="40" y="65" width="370" height="470" rx="5" fill="#0c1424" stroke="#6b7280" strokeWidth="2" />
      {imageUrl ? (
          <image 
              href={imageUrl} 
              x="40" y="65" 
              width="370" 
              height="470" 
              preserveAspectRatio="xMidYMid slice" 
              clipPath="url(#image-board-clip)"
          />
      ) : (
          <text x="225" y="300" textAnchor="middle" fill="#6b7280" fontSize="20" fontFamily="Poppins, sans-serif">
              Image will appear here
          </text>
      )}

      {/* Right Digital Board */}
      <rect x="775" y="50" width="400" height="600" rx="15" fill="#4b5563" />
      <rect x="790" y="65" width="370" height="570" rx="5" fill="#0c1424" stroke="#6b7280" strokeWidth="2" />
      <g clipPath="url(#board-clip)">
        <text
            ref={textRef}
            x="810"
            y="85"
            dominantBaseline="hanging"
            textAnchor="start"
            fontSize="24"
            fill="#e5e7eb"
            fontFamily="Poppins, sans-serif"
            className={Object.keys(animationStyle).length > 0 ? 'scrolling-board-text' : ''}
            style={animationStyle as React.CSSProperties}
        >
            {wrappedLines.map((line, index) => (
                <tspan x="810" dy={index === 0 ? 0 : "1.4em"} key={index}>
                    {line || ' '}
                </tspan>
            ))}
        </text>
      </g>
      
      {/* Character Group - for transforming the entire character */}
      <g transform={transform}>
        {/* Shadow */}
        <ellipse 
          cx={shadowCx} 
          cy={shadowCy} 
          rx={shadowRx} 
          ry={shadowRy} 
          fill="url(#shadow-grad)" 
          className={`pointer-events-none transition-all duration-100 ease-out`}
        />

        {/* Legs */}
        <Leg legPose={pose.leftLeg} onDragStart={onDragStart} limb="leftLeg" isDragging={isDragging} />
        <Leg legPose={pose.rightLeg} onDragStart={onDragStart} limb="rightLeg" isDragging={isDragging} />

        {/* Body */}
        <g className="pointer-events-none">
          {/* Base shirt */}
          <path d="M 90 220 C 100 280, 110 350, 120 440 L 240 440 C 250 350, 260 280, 270 220 C 240 215, 120 215, 90 220 Z" fill="#d1d5db" className={`stroke-slate-600 ${transitionClassBody}`} strokeWidth="1" />
          {/* Sweater Vest */}
          <path d="M 100 220 C 110 280, 120 350, 120 440 L 240 440 C 240 350, 250 280, 260 220 L 240 225 L 120 225 Z" fill="#c0392b" className={`stroke-slate-600 ${transitionClassBody}`} strokeWidth="3" />
          {/* Collar */}
          <path d="M 165 220 L 180 235 L 195 220 Z" fill="#d1d5db" className={`stroke-slate-600 ${transitionClassBody}`} strokeWidth="2" />
          
          <path d="M 120 440 L 240 440 L 235 450 L 125 450 Z" fill="#475569" className={transitionClassBody} />
        </g>


        {/* Arms & Hands - order matters for 'FOLD' pose */}
        {pose.leftArm[2].x > pose.rightArm[2].x && activePose !== 'IDLE' && activePose !== 'HEART' ? (
          <>
              <Arm armPose={pose.rightArm} onDragStart={onDragStart} limb="rightArm" isDragging={isDragging} />
              <Hand handPose={pose.rightHand} strokeColor="stroke-[#bf9d7a]" isDragging={isDragging} hand="rightHand" onDragStart={onDragStart} />
              <Arm armPose={pose.leftArm} onDragStart={onDragStart} limb="leftArm" isDragging={isDragging} />
              <Hand handPose={pose.leftHand} strokeColor="stroke-[#bf9d7a]" isDragging={isDragging} hand="leftHand" onDragStart={onDragStart} />
          </>
        ) : (
          <>
              <Arm armPose={pose.leftArm} onDragStart={onDragStart} limb="leftArm" isDragging={isDragging} />
              <Hand handPose={pose.leftHand} strokeColor="stroke-[#bf9d7a]" isDragging={isDragging} hand="leftHand" onDragStart={onDragStart} />
              <Arm armPose={pose.rightArm} onDragStart={onDragStart} limb="rightArm" isDragging={isDragging} />
              <Hand handPose={pose.rightHand} strokeColor="stroke-[#bf9d7a]" isDragging={isDragging} hand="rightHand" onDragStart={onDragStart} />
          </>
        )}

        {/* Accessories for Teacher Pose */}
          {activePose === 'EXAMINE_BOARD' && (
              <g className={`pointer-events-none ${transitionClassBody}`}>
                  {/* Book */}
                  <g transform={`translate(${pose.leftArm[2].x + 10}, ${pose.leftArm[2].y - 20}) rotate(-10)`}>
                      <rect x="-30" y="-50" width="80" height="100" rx="5" fill="#f39c12" className="stroke-slate-800" strokeWidth="2"/>
                      <rect x="-25" y="-45" width="70" height="90" fill="#fdfefe"/>
                      <rect x="0" y="-45" width="2" height="90" fill="#e74c3c" />
                  </g>
                  {/* Chalk */}
                  <rect 
                      x={pose.rightHand[1][2].x - 5} 
                      y={pose.rightHand[1][2].y - 20} 
                      width="6" height="25" 
                      fill="white" 
                      stroke="grey" 
                      strokeWidth="0.5" 
                      transform={`rotate(10, ${pose.rightHand[1][2].x}, ${pose.rightHand[1][2].y})`} 
                  />
              </g>
          )}


        {/* Neck */}
        <path d="M 165 220 L 195 220 L 190 195 L 170 195 Z" fill={skinTone} className={`stroke-slate-600 pointer-events-none ${transitionClassBody}`} strokeWidth="2" />

        {/* Head & Face */}
        <g className={`pointer-events-none ${transitionClassBody}`}>
          <path 
            d="M145,200 C110,200 105,150 110,110 C115,60 245,60 250,110 C255,150 250,200 215,200 C200,205 160,205 145,200 Z"
            fill="url(#grad-head)" 
            className="stroke-slate-600" 
            strokeWidth="3" 
          />
          <g fill="#4a3728">
              <path d="M 110 115 C 120 70, 240 70, 250 115 Q 255 130 230 130 C 180 140, 130 130, 120 125 Z" />
          </g>
          
          <g transform="translate(0, 10)">
              {/* Eyebrows */}
              <path d={eyebrowPaths.left} stroke="#4a3728" strokeWidth="4" fill="none" strokeLinecap="round" className="transition-all duration-300" />
              <path d={eyebrowPaths.right} stroke="#4a3728" strokeWidth="4" fill="none" strokeLinecap="round" className="transition-all duration-300" />
              
              {/* Glasses */}
              <g stroke="#374151" strokeWidth="3" fill="none">
                <circle cx="155" cy="128" r="12" />
                <circle cx="205" cy="128" r="12" />
                <path d="M 167 128 L 193 128" />
              </g>

              {/* Eyes */}
              <circle cx="155" cy="128" r="5" fill="#3d2d20" />
              <circle cx="205" cy="128" r="5" fill="#3d2d20" />
              
              {/* Eyelids for blinking */}
              <rect x="150" y="123" width="10" height="10" fill={skinTone} className="blinking-eyelid" />
              <rect x="200" y="123" width="10" height="10" fill={skinTone} className="blinking-eyelid" />

              {/* Nose */}
              <path d="M 180 140 L 175 155 L 185 155" stroke="#b49a7c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              
              {/* Mouth */}
              <path d={mouthPath} stroke="#997b66" strokeWidth="3" fill="none" strokeLinecap="round" className="transition-all duration-300"/>
          </g>
        </g>
      </g>
    </svg>
  );
};

export default ModelViewer;
