import { useCallback,useEffect,useState } from 'react'
import { BadgeCheck,ExternalLink,ShieldCheck } from 'lucide-react'
import { authenticatedFetch } from '@/client/auth'
import { CreatorShell } from './CreatorShell'

type Status={status:string;ageVerified:boolean;verifiedAt:string|null}
const verificationEmail='mailto:hello@unrealcake8.site?subject=Account%20verification&body=Hello%2C%0A%0AI%20would%20like%20to%20start%20the%20account%20verification%20process.'
export function IdentityVerification(){
  const [status,setStatus]=useState<Status>();const [error,setError]=useState('')
  const refresh=useCallback(async()=>{const response=await authenticatedFetch('/api/identity/session');if(response.status===401){location.assign('/login');return}if(!response.ok)throw new Error('Verification status could not be loaded.');setStatus(await response.json())},[])
  useEffect(()=>{refresh().catch(error=>setError(error instanceof Error?error.message:'Verification status could not be loaded.'))},[refresh])
  return <CreatorShell><div className="pageTitle"><div><span className="eyebrow">IDENTITY</span><h1>Age verification</h1><p>Verify that you are at least 18 before your channel can stream.</p></div></div><section className="verificationCard"><div className={`verificationIcon ${status?.ageVerified?'verified':''}`}>{status?.ageVerified?<BadgeCheck/>:<ShieldCheck/>}</div><div><span className="eyebrow">{status?.ageVerified?'VERIFIED':'STREAMING REQUIREMENT'}</span><h2>{status?.ageVerified?'You are cleared to stream':'Confirm your age securely'}</h2><p>{status?.ageVerified?'Your identity check is complete. You can enable your channel and reveal your OBS credentials.':'Email the uc8Live team to start the account verification process. We store only your verification status and calculated age—not document images or identity details.'}</p>{status&&!status.ageVerified&&status.status!=='not_started'&&<div className="notice">Current status: <b>{status.status.replaceAll('_',' ')}</b>. Final decisions arrive securely by webhook.</div>}{error&&<div className="error">{error}</div>}{!status?.ageVerified&&<a className="primary" href={verificationEmail}>Start account verification <ExternalLink/></a>}</div></section></CreatorShell>
}
