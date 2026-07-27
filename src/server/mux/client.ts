import Mux from '@mux/mux-node'
import { env } from '../env'
let instance:Mux|undefined
export function muxClient(){if(!instance){const e=env();instance=new Mux({tokenId:e.MUX_TOKEN_ID,tokenSecret:e.MUX_TOKEN_SECRET})}return instance}
