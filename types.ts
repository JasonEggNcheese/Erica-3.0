
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


// Types for LLM Models
export type LLMProvider = 'google' | 'anthropic' | 'openai';

export interface LLMModel {
    id: string;
    name: string;
    provider: LLMProvider;
    description: string;
}

export const availableModels: LLMModel[] = [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'Google\'s most capable model' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', description: 'Fast and efficient' },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Anthropic\'s best balanced model' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'OpenAI\'s flagship multimodal model' },
];

export type ModelId = typeof availableModels[number]['id'];

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
