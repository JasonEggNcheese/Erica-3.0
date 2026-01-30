
export enum SessionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export enum Speaker {
    USER = 'USER',
    ERICA = 'ERICA',
}

export interface ConversationTurn {
    speaker: Speaker;
    text: string;
    isFinal?: boolean;
}

export const availableVoices = [
  { id: 'Kore', name: 'Kore (Default)' },
  { id: 'Zephyr', name: 'Zephyr' },
  { id: 'Puck', name: 'Puck' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Fenrir', name: 'Fenrir' },
] as const;

export type VoiceId = typeof availableVoices[number]['id'];


// Types for Agentic Vision
export type ActionType = 'TYPE' | 'CLICK' | 'SCROLL' | 'WAIT' | 'FINISH';

export interface AgentAction {
  action_type: ActionType;
  x?: number;
  y?: number;
  text_to_type?: string;
  scroll_direction?: 'up' | 'down';
  duration?: number;
  thought: string;
}

// Types for Research Agent
export interface GroundingSource {
    web?: {
        uri: string;
        title: string;
    }
}

// Types for Chat Agent
export interface ChatPart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string; // base64 string
    };
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: ChatPart[];
}

// Types for Gesture Recognition
export type GestureType = 'WAVING' | 'COUNTING_FINGERS' | 'THUMBS_UP' | 'SIGN_LANGUAGE';

export interface Gesture {
  gesture: GestureType;
  count?: number;
  sign?: string;
}

// Types for Object Detection
export interface DetectedObject {
    label: string;
    confidence: number;
    box: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
}
