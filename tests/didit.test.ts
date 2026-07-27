import { createHmac } from 'node:crypto'
import { describe,expect,it } from 'vitest'
import { ageOn,canonicalJson,verifyDiditSignature } from '@/server/didit/verification'

describe('Didit verification security',()=>{
  it('canonicalizes nested objects while preserving array order',()=>{
    expect(canonicalJson({z:'é',a:{d:2,c:1},items:[{b:2,a:1}]})).toBe('{"a":{"c":1,"d":2},"items":[{"a":1,"b":2}],"z":"é"}')
  })
  it('accepts a fresh signature and rejects replayed timestamps',()=>{
    const payload={status:'Approved',session_id:'session',vendor_data:'user'};const now=1_800_000_000_000;const timestamp=String(now/1000)
    const signature=createHmac('sha256','secret').update(canonicalJson(payload)).digest('hex')
    expect(verifyDiditSignature(payload,signature,timestamp,'secret',now)).toBe(true)
    expect(verifyDiditSignature(payload,signature,String(now/1000-301),'secret',now)).toBe(false)
  })
  it('calculates age at the birthday boundary',()=>{
    expect(ageOn('2008-07-27',new Date('2026-07-27T00:00:00Z'))).toBe(18)
    expect(ageOn('2008-07-28',new Date('2026-07-27T23:59:59Z'))).toBe(17)
  })
})
