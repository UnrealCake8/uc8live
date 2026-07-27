import {describe,expect,it,vi} from 'vitest'
import {channelInput,createChannel,mayView} from '@/server/channels/channel-service'
import {hasRecentAuthentication} from '@/server/auth/recent'
import fs from 'node:fs'

describe('channel security and lifecycle',()=>{
  it('rejects private channel creation until signed playback is rolled out',()=>{expect(()=>channelInput.parse({slug:'safe',title:'My stream',category:'Music',visibility:'private'})).toThrow()})
  it('keeps unlisted out of public-directory implementation',()=>{const source=fs.readFileSync('src/server/channels/channel-service.ts','utf8');expect(source).toContain(".eq('visibility','public')")})
  it('enforces private playback ownership',()=>{expect(mayView('private',undefined,'owner')).toBe(false);expect(mayView('private','owner','owner')).toBe(true);expect(mayView('unlisted',undefined,'owner')).toBe(true)})
  it('requires recent authentication for stream secrets',()=>{expect(hasRecentAuthentication({last_sign_in_at:new Date(Date.now()-700_000).toISOString()} as any)).toBe(false);expect(hasRecentAuthentication({last_sign_in_at:new Date().toISOString()} as any)).toBe(true)})
  it('cleans up Mux when database creation fails',async()=>{const remove=vi.fn().mockResolvedValue(undefined);const db:any={from:vi.fn((table:string)=>table==='live_channels'?{select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})}),insert:()=>({select:()=>({single:async()=>({error:{message:'down'}})})})}:null)};await expect(createChannel('owner',{slug:'safe',title:'My stream',description:'',category:'Music',thumbnailUrl:null,visibility:'public'},{db,mux:{create:vi.fn().mockResolvedValue({id:'mux-1',playback_ids:[{id:'play-1'}]}),remove}})).rejects.toThrow('CHANNEL_SAVE_FAILED');expect(remove).toHaveBeenCalledWith('mux-1')})
})
