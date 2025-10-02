
import React, { useState, MouseEvent, useRef, useEffect, useCallback } from 'react';
import ModelViewer from './components/ModelViewer';
import PoseControls from './components/PoseControls';
import QuizModal from './components/QuizModal';
import type { Pose, PoseName, Point } from './types';
import { POSES, WALK_CYCLE } from './constants';
import { produce } from 'immer';
import { GoogleGenAI, Type, Modality, LiveServerMessage, Blob, FunctionDeclaration } from "@google/genai";
import { encode, decode, decodeAudioData, createBlob } from './audioUtils';

type DraggedLimbPointInfo = {
  type: 'limb';
  limb: 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
  pointIndex: 1 | 2; // 0 is shoulder/hip (static), 1 is elbow/knee, 2 is wrist/ankle
};

type DraggedFingerPointInfo = {
    type: 'finger';
    hand: 'leftHand' | 'rightHand';
    fingerIndex: number;
    pointIndex: 1 | 2;
};

type DraggedPointInfo = DraggedLimbPointInfo | DraggedFingerPointInfo | null;

type FacialExpression = 'neutral' | 'happy' | 'sad';
type SessionPhase = 'setup' | 'generating_image' | 'live_session';
type ConnectionState = 'disconnected' | 'connecting' | 'connected';

// --- Main App Component ---
const App: React.FC = () => {
  const [currentPose, setCurrentPose] = useState<Pose>(POSES.IDLE);
  const [activeButton, setActiveButton] = useState<PoseName>('IDLE');
  const [draggedPoint, setDraggedPoint] = useState<DraggedPointInfo>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // App State
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('setup');
  const [courseTopic, setCourseTopic] = useState('');
  const [className, setClassName] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);

  // Board State
  const [boardText, setBoardText] = useState<string>('');
  
  // Image Board State
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Speech and Animation State
  const [isCharacterSpeaking, setIsCharacterSpeaking] = useState(false);
  const [mouthShape, setMouthShape] = useState<'closed' | 'open'>('closed');
  const speakingAnimPoseRef = useRef<Pose | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [facialExpression, setFacialExpression] = useState<FacialExpression>('neutral');

  // Quiz State
  const [quizContent, setQuizContent] = useState<{ question: string; options: string[]; functionCallId: string; } | null>(null);
  
  // --- Gemini Live State ---
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const userMediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // --- Game-like Movement State ---
  const [xOffset, setXOffset] = useState(510);
  const [facingDirection, setFacingDirection] = useState<'right' | 'left'>('right');
  const [stepAnimation, setStepAnimation] = useState<{
    active: boolean;
    startTime: number;
    startOffset: number;
    targetOffset: number;
    duration: number;
    steps: number;
  } | null>(null);
  
  const animationFrameId = useRef<number | null>(null);
  
  // --- Start of smooth dragging logic ---
  const targetCoords = useRef<Point | null>(null);
  const interpolationFactor = 0.25;

  const poseRef = useRef(currentPose);
  useEffect(() => {
    poseRef.current = currentPose;
  }, [currentPose]);
  
  const interruptActivity = useCallback(() => {
    if (stepAnimation?.active) {
        setStepAnimation(null);
    }
    if (isCharacterSpeaking) {
        setIsCharacterSpeaking(false);
        setMouthShape('closed');
    }
  }, [stepAnimation, isCharacterSpeaking]);

  // --- Unified Animation Loop ---
  const animationLoop = useCallback((timestamp: number) => {
    let needsPoseUpdate = false;
    let nextPose = poseRef.current;

    // Dragging logic
    if (draggedPoint && targetCoords.current) {
        needsPoseUpdate = true;
        nextPose = produce(nextPose, draft => {
            if (draggedPoint.type === 'limb') {
                const { limb, pointIndex } = draggedPoint;
                const pointToMove = draft[limb][pointIndex];
                const oldPoint = { ...pointToMove };
                pointToMove.x += (targetCoords.current!.x - pointToMove.x) * interpolationFactor;
                pointToMove.y += (targetCoords.current!.y - pointToMove.y) * interpolationFactor;
                
                const dx = pointToMove.x - oldPoint.x;
                const dy = pointToMove.y - oldPoint.y;

                if (pointIndex === 2 && (limb === 'leftArm' || limb === 'rightArm')) {
                    const handToMove = limb === 'leftArm' ? 'leftHand' : 'rightHand';
                    draft[handToMove].forEach(finger => finger.forEach(point => {
                        point.x += dx;
                        point.y += dy;
                    }));
                }
            } else if (draggedPoint.type === 'finger') {
                const { hand, fingerIndex, pointIndex } = draggedPoint;
                const pointToMove = draft[hand][fingerIndex][pointIndex];
                pointToMove.x += (targetCoords.current!.x - pointToMove.x) * interpolationFactor;
                pointToMove.y += (targetCoords.current!.y - pointToMove.y) * interpolationFactor;
            }
        });
    }

    // Stepping animation logic
    if (stepAnimation?.active) {
        const elapsedTime = timestamp - stepAnimation.startTime;
        const progress = Math.min(elapsedTime / stepAnimation.duration, 1);
        const newXOffset = stepAnimation.startOffset + (stepAnimation.targetOffset - stepAnimation.startOffset) * progress;
        setXOffset(newXOffset);

        const frameIndex = Math.floor(progress * WALK_CYCLE.length * stepAnimation.steps / 2) % WALK_CYCLE.length;
        nextPose = WALK_CYCLE[frameIndex];
        needsPoseUpdate = true;
        
        if (progress >= 1) {
            setXOffset(stepAnimation.targetOffset);
            setStepAnimation(null);
            nextPose = POSES.IDLE;
        }
    }
    
    // Speaking animation logic
    if (isCharacterSpeaking && speakingAnimPoseRef.current) {
        needsPoseUpdate = true;
        const basePoseForSpeech = speakingAnimPoseRef.current;
        const mouthOpen = Math.floor(timestamp / 200) % 2 === 0;
        setMouthShape(mouthOpen ? 'open' : 'closed');
        const gestureLoopDuration = 2000;
        const progress = (performance.now() % gestureLoopDuration) / gestureLoopDuration;
        const easeFactor = Math.sin(progress * Math.PI);
        const wristOffsetX = 15 * easeFactor;
        const wristOffsetY = -10 * easeFactor; 
        
        nextPose = produce(basePoseForSpeech, draft => {
            draft.rightArm[2].x = basePoseForSpeech.rightArm[2].x + wristOffsetX;
            draft.rightArm[2].y = basePoseForSpeech.rightArm[2].y + wristOffsetY;
            draft.rightHand.forEach((finger, fIndex) => finger.forEach((point, pIndex) => {
                point.x = basePoseForSpeech.rightHand[fIndex][pIndex].x + wristOffsetX;
                point.y = basePoseForSpeech.rightHand[fIndex][pIndex].y + wristOffsetY;
            }));
            draft.leftArm[2].x = basePoseForSpeech.leftArm[2].x - wristOffsetX;
            draft.leftArm[2].y = basePoseForSpeech.leftArm[2].y + wristOffsetY;
            draft.leftHand.forEach((finger, fIndex) => finger.forEach((point, pIndex) => {
                point.x = basePoseForSpeech.leftHand[fIndex][pIndex].x - wristOffsetX;
                point.y = basePoseForSpeech.leftHand[fIndex][pIndex].y + wristOffsetY;
            }));
        });
    }

    if (needsPoseUpdate) {
        setCurrentPose(nextPose);
        if (isDragging) setActiveButton('CUSTOM');
    }

    animationFrameId.current = requestAnimationFrame(animationLoop);
  }, [draggedPoint, isDragging, interpolationFactor, stepAnimation, isCharacterSpeaking]);
  

  // Effect to manage the animation loop
  useEffect(() => {
    if (isDragging || stepAnimation?.active || isCharacterSpeaking) {
        if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(animationLoop);
        }
    } else if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    }
    return () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isDragging, stepAnimation, isCharacterSpeaking, animationLoop]);


  const handlePoseChange = (poseName: PoseName) => {
    interruptActivity();
    if (poseName !== 'CUSTOM') {
      const newPose = POSES[poseName as Exclude<PoseName, 'CUSTOM' | 'RESET'>] || POSES.IDLE;
      setCurrentPose(newPose);
      setActiveButton(poseName === 'RESET' ? 'IDLE' : poseName);
    }
  };
  
  const handleStep = useCallback((direction: 'left' | 'right', steps: number) => {
    if (stepAnimation?.active) return;
    const STEP_DISTANCE_PER_STEP = 40;
    const DURATION_PER_STEP = 400;
    const MIN_X = 430;
    const MAX_X = 590;
    const totalDistance = STEP_DISTANCE_PER_STEP * steps;
    let newTargetOffset = xOffset + (direction === 'right' ? totalDistance : -totalDistance);
    newTargetOffset = Math.max(MIN_X, Math.min(MAX_X, newTargetOffset));
    if (newTargetOffset === xOffset) return;
    setFacingDirection(direction);
    setStepAnimation({
        active: true,
        startTime: performance.now(),
        startOffset: xOffset,
        targetOffset: newTargetOffset,
        duration: DURATION_PER_STEP * steps,
        steps: steps,
    });
}, [xOffset, stepAnimation]);

// --- Random idle movement ---
useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    const performIdleAction = () => {
        if (sessionPhase === 'live_session' && !isCharacterSpeaking && !stepAnimation?.active && !isDragging) {
            const direction = Math.random() > 0.5 ? 'right' : 'left';
            const steps = Math.random() > 0.5 ? 1 : 2;
            handleStep(direction, steps);
        }
        idleTimeout = setTimeout(performIdleAction, 4000 + Math.random() * 2000);
    };
    if (sessionPhase === 'live_session') {
        idleTimeout = setTimeout(performIdleAction, 4000);
    }
    return () => clearTimeout(idleTimeout);
}, [sessionPhase, isCharacterSpeaking, stepAnimation, isDragging, handleStep]);


  const getSVGCoordinates = (event: MouseEvent<SVGSVGElement>): Point => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const screenCTM = svg.getScreenCTM();
    return screenCTM ? pt.matrixTransform(screenCTM.inverse()) : { x: 0, y: 0 };
  };

  const handleDragStart = (info: NonNullable<DraggedPointInfo>) => {
    interruptActivity();
    setDraggedPoint(info);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedPoint(null); 
    targetCoords.current = null;
  };
  
  const handleDrag = (event: MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    targetCoords.current = getSVGCoordinates(event);
  };

    const cleanupLiveSession = useCallback(() => {
        if (userMediaStreamRef.current) {
            userMediaStreamRef.current.getTracks().forEach(track => track.stop());
            userMediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        sessionPromiseRef.current = null;
        setConnectionState('disconnected');
    }, []);

    const showQuizFunctionDeclaration: FunctionDeclaration = {
      name: 'showQuiz',
      parameters: {
        type: Type.OBJECT,
        description: 'Displays a multiple-choice quiz question to the student to test their understanding.',
        properties: {
          question: {
            type: Type.STRING,
            description: 'The quiz question to ask the student.',
          },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: 'An array of 3 to 4 possible answers for the multiple-choice question.',
          },
        },
        required: ['question', 'options'],
      },
    };

    const handleQuizAnswer = (answer: string) => {
        if (!quizContent) return;

        sessionPromiseRef.current?.then(session => {
            session.sendToolResponse({
                functionResponses: {
                    id: quizContent.functionCallId,
                    name: 'showQuiz',
                    response: { result: `The student selected the answer: "${answer}"` }
                }
            });
        });

        setQuizContent(null);
    };

    const handleStartSession = async () => {
        if (!courseTopic || !className) {
            setSetupError("Please fill in both fields.");
            return;
        }
        interruptActivity();
        setSessionPhase('generating_image');
        setConnectionState('connecting');
        setSetupError(null);
        setBoardText('');
        setImageUrl(null);

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setSetupError("API_KEY environment variable not set.");
            setSessionPhase('setup');
            setConnectionState('disconnected');
            return;
        }
        const ai = new GoogleGenAI({ apiKey });

        try {
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A vibrant, friendly, and educational illustration for a ${className} class about ${courseTopic}. Style: clean, simple, digital art, no text.`,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
            });
            const base64ImageBytes = imageResponse?.generatedImages?.[0]?.image?.imageBytes;
            if (!base64ImageBytes) throw new Error("The AI returned an empty image.");
            setImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
            
            inputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setConnectionState('connected');
                        setSessionPhase('live_session');
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            userMediaStreamRef.current = stream;
                            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContextRef.current!.destination);
                            scriptProcessorRef.current = scriptProcessor;

                        } catch (err) {
                            console.error('Error getting user media:', err);
                            setSetupError('Microphone access is required for the live session.');
                            handleEndSession();
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'showQuiz' && fc.args?.question && fc.args?.options) {
                                    setQuizContent({
                                        question: fc.args.question as string,
                                        options: fc.args.options as string[],
                                        functionCallId: fc.id,
                                    });
                                }
                            }
                        }

                        if (message.serverContent?.outputTranscription) {
                            setBoardText(prev => prev + message.serverContent!.outputTranscription.text);
                        }

                        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            if (!isCharacterSpeaking) {
                                speakingAnimPoseRef.current = poseRef.current;
                                setIsCharacterSpeaking(true);
                                setFacialExpression('happy');
                            }
                            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
                            speakingTimeoutRef.current = setTimeout(() => {
                                setIsCharacterSpeaking(false);
                                setFacialExpression('neutral');
                                setMouthShape('closed');
                            }, 500);

                            const outputContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputContext, 24000, 1);
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setSetupError('A connection error occurred.');
                        handleEndSession();
                    },
                    onclose: (e: CloseEvent) => {
                        cleanupLiveSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    tools: [{ functionDeclarations: [showQuizFunctionDeclaration] }],
                    systemInstruction: `You are a friendly and helpful teacher leading a class. Your current lesson is for a ${className} class about ${courseTopic}. Keep your responses concise and engaging for the students. To test the student's understanding, you can use the 'showQuiz' function to present a multiple-choice question.`,
                },
            });
        } catch (error) {
            console.error("Error starting session:", error);
            setSetupError(error instanceof Error ? error.message : "An unknown error occurred.");
            setSessionPhase('setup');
            setConnectionState('disconnected');
        }
    };
    
    const handleEndSession = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        cleanupLiveSession();
        // Reset state
        setCourseTopic('');
        setClassName('');
        setBoardText('');
        setImageUrl(null);
        setCurrentPose(POSES.IDLE);
        setActiveButton('IDLE');
        setXOffset(510);
        setFacialExpression('neutral');
        setIsCharacterSpeaking(false);
        setSessionPhase('setup');
    }, [cleanupLiveSession]);


  if (sessionPhase !== 'live_session') {
    const isSettingUp = sessionPhase === 'generating_image' || connectionState === 'connecting';
    return (
      <main className="h-screen p-4 font-sans flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="w-full max-w-lg bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-cyan-500/10 border border-slate-700 p-8 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-slate-100">Welcome, Teacher!</h1>
          <p className="text-slate-400">Let's set up your virtual classroom. What will you be teaching today?</p>
          
          <div className="space-y-4 text-left">
            <div>
                <label htmlFor="class-name" className="block text-sm font-medium text-slate-300 mb-1">Class / Grade Level</label>
                <input
                    id="class-name"
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g., 5th Grade Science"
                    className="w-full p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                    disabled={isSettingUp}
                />
            </div>
            <div>
                <label htmlFor="course-topic" className="block text-sm font-medium text-slate-300 mb-1">Topic for Today's Lesson</label>
                <input
                    id="course-topic"
                    type="text"
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    placeholder="e.g., The Solar System"
                    className="w-full p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                    disabled={isSettingUp}
                />
            </div>
          </div>

          <button
            onClick={handleStartSession}
            disabled={isSettingUp || !courseTopic || !className}
            className="w-full px-6 py-4 rounded-lg text-lg font-medium transition-all duration-300 ease-in-out flex items-center justify-center space-x-3 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-cyan-600 text-white hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20"
            >
            {isSettingUp ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Preparing Classroom...</span>
                </>
            ) : (
                <span>Start Session</span>
            )}
            </button>
            {setupError && <p className="text-sm text-rose-400 pt-2">{setupError}</p>}
        </div>
      </main>
    );
  }


  return (
    <main className="h-screen p-4 font-sans">
      <QuizModal 
        isOpen={!!quizContent}
        question={quizContent?.question || ''}
        options={quizContent?.options || []}
        onAnswer={handleQuizAnswer}
      />
      <div className="w-full h-full bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden border border-slate-700 flex flex-col">
        <div className="grid md:grid-cols-5 gap-6 p-6 items-start flex-grow overflow-hidden">
          <div className="md:col-span-3 w-full h-full flex items-center justify-center bg-slate-900/50 rounded-lg p-2">
            <ModelViewer 
              pose={currentPose}
              activePose={activeButton}
              isDragging={isDragging}
              boardText={boardText}
              imageUrl={imageUrl}
              xOffset={xOffset}
              scale={1.0}
              scrollSpeed={1.75}
              facingDirection={facingDirection}
              mouthShape={mouthShape}
              facialExpression={facialExpression}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
            />
          </div>
          <div className="md:col-span-2 flex flex-col justify-start space-y-6 h-full overflow-y-auto pr-2">
            <PoseControls
              activePose={activeButton}
              onPoseChange={handlePoseChange}
              onEndSession={handleEndSession}
            />
             <div className="flex flex-col space-y-4">
                <h2 className="text-xl font-semibold text-slate-300">Facial Expression</h2>
                <div className="flex space-x-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    {(['neutral', 'happy', 'sad'] as FacialExpression[]).map(exp => (
                        <button
                            key={exp}
                            onClick={() => {
                                interruptActivity();
                                setFacialExpression(exp);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium capitalize transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500
                                ${facialExpression === exp ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                        >
                            {exp}
                        </button>
                    ))}
                </div>
            </div>
             <div className="flex flex-col space-y-4">
                <h2 className="text-xl font-semibold text-slate-300">Digital Board</h2>
                <div className="flex flex-col space-y-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                     <textarea
                        value={boardText}
                        readOnly
                        className="w-full p-3 mt-2 rounded-lg bg-slate-900 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors h-32 resize-none"
                        placeholder="Live lesson transcript will appear here..."
                    />
                </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;
