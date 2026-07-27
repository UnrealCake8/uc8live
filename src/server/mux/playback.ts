import { SignJWT, importPKCS8 } from 'jose'
import { env } from '../env'
export async function createPlaybackToken(playbackId:string,expiresIn=3600){const e=env();if(!e.MUX_SIGNING_KEY_ID||!e.MUX_SIGNING_PRIVATE_KEY)throw new Error('Signed playback is not configured');const key=await importPKCS8(e.MUX_SIGNING_PRIVATE_KEY.replace(/\\n/g,'\n'),'RS256');return new SignJWT({sub:playbackId,aud:'v'}).setProtectedHeader({alg:'RS256',kid:e.MUX_SIGNING_KEY_ID}).setExpirationTime(`${expiresIn}s`).sign(key)}
