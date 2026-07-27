export interface CreateBroadcastSessionInput { channelId:string }
export interface BroadcastSession { id:string; playbackId:string }
export interface BroadcastProvider { createSession(input:CreateBroadcastSessionInput):Promise<BroadcastSession>; endSession(sessionId:string):Promise<void> }
