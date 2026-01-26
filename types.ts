
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
    isFinal: boolean;
}

export const availableVoices = [
  { id: 'Kore', name: 'Kore (Default)' },
  { id: 'Zephyr', name: 'Zephyr' },
  { id: 'Puck', name: 'Puck' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Fenrir', name: 'Fenrir' },
] as const;

export type VoiceId = typeof availableVoices[number]['id'];
